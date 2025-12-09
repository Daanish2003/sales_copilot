// media-track.stateless.ts
import type {
  Consumer,
  DirectTransport,
  MediaKind,
  Producer,
  Router,
  RtpCapabilities,
  RtpParameters,
  WebRtcTransport,
} from "mediasoup/types";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";

/**
 * Create a Producer for a client.
 * - Returns the created Producer and its id.
 * - Caller is responsible for storing/managing lifecycle and event handlers.
 */
export async function createClientProducerTrack(opts: {
  transport: WebRtcTransport;
  kind: MediaKind;
  rtpParameters: RtpParameters;
}) {
  const { transport, kind, rtpParameters } = opts;
  try {
    if (!transport) throw new Error("Producer transport is required");

    const producer = await transport.produce({ kind, rtpParameters });
    return { producer, producerId: producer.id };
  } catch (error) {
    const appError = new AppError("Failed to create client producer track", {
      code: "PRODUCER_CREATE_FAILED",
      cause: error,
    });
    logger.error(appError.message, { kind, error: appError });
    throw appError;
  }
}

/**
 * Create a Consumer for a client (stateless).
 * - Returns { consumer, consumerParams } on success.
 * - If router.canConsume returns false, returns { message: "Cannot consume" }.
 * - Caller manages lifecycle and event handlers.
 */
export async function createClientConsumerTrack(opts: {
  transport: WebRtcTransport;
  router: Router;
  rtpCapabilities: RtpCapabilities;
  producerId: string;
}) {
  const { transport, router, rtpCapabilities, producerId } = opts;
  try {
    const canConsume = router.canConsume({
      producerId,
      rtpCapabilities,
    });

    if (!canConsume) {
      return { message: "Cannot consume" } as const;
    }

    if (!transport) {
      throw new Error("Consumer transport is required");
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });

    if (!consumer) {
      throw new Error("Consumer not created");
    }

    const consumerParams = {
      producerId,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };

    return { consumer, consumerParams };
  } catch (error) {
    const appError = new AppError(`Failed to create client consumer for ${producerId}`, {
      code: "CONSUME_MEDIA_FAILED",
      cause: error,
    });
    logger.error(appError.message, { producerId, error: appError });
    throw appError;
  }
}

/**
 * Resume (unpause) a consumer instance.
 * - Caller must provide the consumer instance (stateless).
 */
export async function unpauseConsumer(consumer?: Consumer) {
  try {
    if (!consumer) {
      throw new AppError("Consumer instance is required", { code: "CONSUMER_INSTANCE_REQUIRED" });
    }
    await consumer.resume();
    return { success: true };
  } catch (error) {
    const appError = new AppError("Failed to unpause consumer", {
      code: "UNPAUSE_CONSUMER_FAILED",
      cause: error,
    });
    logger.error(appError.message, { error: appError });
    throw appError;
  }
}

/**
 * Create a Consumer on a DirectTransport for the agent.
 * - Returns the created Consumer instance.
 * - Caller manages lifecycle.
 */
export async function createAgentConsumerTrack(opts: {
  transport: DirectTransport;
  rtpCapabilities: RtpCapabilities;
  producerId: string;
}) {
  const { transport, rtpCapabilities, producerId } = opts;
  try {
    if (!transport) throw new Error("Agent transport is required");

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });

    return consumer;
  } catch (error) {
    const appError = new AppError(`Failed to create agent consumer for ${producerId}`, {
      code: "AGENT_CONSUMER_CREATE_FAILED",
      cause: error,
    });
    logger.error(appError.message, { producerId, error: appError });
    throw appError;
  }
}

/**
 * Create a Producer on a DirectTransport for the agent from a listener's Consumer.
 * - Returns the created Producer instance.
 * - Caller manages lifecycle.
 */
export async function createAgentProducerTrack(opts: {
  transport: DirectTransport;
  listenerTrack: Consumer;
  kind?: MediaKind; // default to 'audio' if omitted
}) {
  const { transport, listenerTrack, kind = "audio" } = opts;
  try {
    if (!transport) throw new Error("Agent transport is required");
    if (!listenerTrack) throw new Error("Listener (consumer) track is required");

    const producer = await transport.produce({
      kind,
      rtpParameters: listenerTrack.rtpParameters,
    });

    return producer;
  } catch (error) {
    const appError = new AppError("Failed to create agent producer track", {
      code: "AGENT_PRODUCER_CREATE_FAILED",
      cause: error,
    });
    logger.error(appError.message, { error: appError });
    throw appError;
  }
}

/**
 * Close a single track (Producer | Consumer) or DirectTransport/WebRtcTransport.
 * - Stateless: caller passes the instance to close.
 * - Safe no-op when falsy; logs any close errors but does not throw.
 */
export function closeTrack(instance?: Producer | Consumer | WebRtcTransport | DirectTransport | null) {
  try {
    if (!instance) return;
    // mediasoup types implement close()
    // @ts-ignore
    instance.close();
  } catch (error) {
    logger.warn("Error while closing instance", { error });
  }
}
