// media-transport.stateless.ts
import type { DirectTransport, DtlsParameters, Router, WebRtcTransport } from "mediasoup/types";
import { config } from "../../config/media-config";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";

/**
 * Extract transport params to send to the client.
 */
export function getTransportParams(transport: WebRtcTransport) {
  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  } as const;
}

/**
 * Create a producer WebRTC transport. Returns the transport instance + params.
 * NO state is stored internally — caller is responsible for storing/managing the transport.
 */
export async function createClientProducerTransport(router: Router) {
  try {
    const transport = await router.createWebRtcTransport(config.mediasoup.webRtcTransport);
    return { transport, transportParams: getTransportParams(transport) };
  } catch (error) {
    const appError = new AppError("Failed to create producer WebRTC transport", {
      code: "PRODUCER_TRANSPORT_CREATE_FAILED",
      cause: error,
    });
    logger.error(appError.message, { error: appError });
    throw appError;
  }
}

/**
 * Connect a given producer WebRTC transport using the provided DTLS parameters.
 * Does NOT look up or manage transports — the transport instance must be provided by the caller.
 */
export async function connectClientProducerTransport(opts: {
  transport: WebRtcTransport;
  dtlsParameters: DtlsParameters;
}) {
  const { transport, dtlsParameters } = opts;
  try {
    if (!transport) throw new Error("Producer transport instance is required");
    await transport.connect({ dtlsParameters });
  } catch (error) {
    const appError = new AppError("Error connecting producer WebRTC transport", {
      code: "PRODUCER_TRANSPORT_CONNECT_FAILED",
      cause: error,
    });
    logger.error(appError.message, { error: appError });
    throw appError;
  }
}

/**
 * Create a consumer WebRTC transport. Returns the transport instance + params.
 * NO state is stored internally.
 */
export async function createClientConsumerTransport(router: Router) {
  try {
    const transport = await router.createWebRtcTransport(config.mediasoup.webRtcTransport);
    return { transport, transportParams: getTransportParams(transport) };
  } catch (error) {
    const appError = new AppError("Failed to create consumer WebRTC transport", {
      code: "CONSUMER_TRANSPORT_CREATE_FAILED",
      cause: error,
    });
    logger.error(appError.message, { error: appError });
    throw appError;
  }
}

/**
 * Connect a given consumer WebRTC transport using the provided DTLS parameters.
 * Does NOT look up or manage transports — the transport instance must be provided by the caller.
 */
export async function connectClientConsumerTransport(opts: {
  transport: WebRtcTransport;
  dtlsParameters: DtlsParameters;
}) {
  const { transport, dtlsParameters } = opts;
  try {
    if (!transport) throw new Error("Consumer transport instance is required");
    await transport.connect({ dtlsParameters });
  } catch (error) {
    const appError = new AppError("Error connecting consumer WebRTC transport", {
      code: "CONSUMER_TRANSPORT_CONNECT_FAILED",
      cause: error,
    });
    logger.error(appError.message, { error: appError });
    throw appError;
  }
}

/**
 * Create a DirectTransport for an agent. Returns the DirectTransport instance.
 * Caller manages lifecycle.
 */
export async function createAgentTransport(router: Router) {
  try {
    const directTransport = await router.createDirectTransport();
    return directTransport;
  } catch (error) {
    const appError = new AppError("Failed to create Direct Transport", {
      code: "DIRECT_TRANSPORT_CREATE_FAILED",
      cause: error,
    });
    logger.error(appError.message, { error: appError });
    throw appError;
  }
}

/**
 * Close a single transport (WebRtcTransport | DirectTransport). No-op if transport is falsy.
 * This function *only* closes the provided transport.
 */
export function closeTransport(transport?: WebRtcTransport | DirectTransport | null) {
  try {
    if (!transport) return;
    // mediasoup transports implement close()
    // @ts-ignore - both WebRtcTransport and DirectTransport have close()
    transport.close();
  } catch (error) {
    // Don't throw here by default; log and swallow so close can be called safely
    logger.warn("Error while closing transport", { error });
  }
}
