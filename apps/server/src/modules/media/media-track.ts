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

export class MediaTrack {
  // client producers: userId -> (kind -> Producer)
  private _clientProducerTracks = new Map<string, Map<MediaKind, Producer>>();

  // client consumers: userId -> (producerId -> Consumer)
  private _clientConsumerTracks = new Map<string, Map<string, Consumer>>();

  private _agentProducerTrack: Producer | null = null;
  private _agentConsumerTrack: Consumer | null = null;

  constructor() {}

  async createClientProducerTrack({
    userId,
    kind,
    rtpParameters,
    transport,
  }: {
    userId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    transport: WebRtcTransport;
  }) {
    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    producer.on("transportclose", () => {
      console.log("Producer transport closed");
      producer.close();
      // cleanup from map
      const kindMap = this._clientProducerTracks.get(userId);
      if (kindMap) {
        kindMap.delete(kind);
        if (kindMap.size === 0) {
          this._clientProducerTracks.delete(userId);
        }
      }
    });

    let kindMap = this._clientProducerTracks.get(userId);
    if (!kindMap) {
      kindMap = new Map<MediaKind, Producer>();
      this._clientProducerTracks.set(userId, kindMap);
    }
    kindMap.set(kind, producer);

    return producer.id;
  }

  async createClientConsumerTrack({
    userId,
    rtpCap,
    transport,
    trackId,
    router,
  }: {
    userId: string;
    rtpCap: RtpCapabilities;
    transport: WebRtcTransport;
    trackId: string; // producerId
    router: Router;
  }) {
    try {
      const canConsume = router.canConsume({
        producerId: trackId,
        rtpCapabilities: rtpCap,
      });

      if (!canConsume) {
        return { message: "Cannot consume" };
      }

      if (!transport) {
        throw new Error("ConsumeRequest: consumer transport not found");
      }

      const consumer = await transport.consume({
        producerId: trackId,
        rtpCapabilities: rtpCap,
        paused: true,
      });

      if (!consumer) {
        throw new Error("Consumer not created");
      }

      let userConsumers = this._clientConsumerTracks.get(userId);
      if (!userConsumers) {
        userConsumers = new Map<string, Consumer>();
        this._clientConsumerTracks.set(userId, userConsumers);
      }
      userConsumers.set(trackId, consumer);

      consumer.on("transportclose", () => {
        console.log("Consumer transport closed");
        consumer.close();
        const map = this._clientConsumerTracks.get(userId);
        if (map) {
          map.delete(trackId);
          if (map.size === 0) {
            this._clientConsumerTracks.delete(userId);
          }
        }
      });

      const consumerParams = {
        producerId: trackId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      };

      return { consumerParams };
    } catch (error) {
      console.error("Error consuming media", error);
      throw new Error(`Failed to create client consumer for ${trackId}: ${error}`);
    }
  }

  async unpauseConsumer({
    userId,
    trackId,
  }: {
    userId: string;
    trackId: string; // producerId
  }) {
    try {
      const consumer = this._clientConsumerTracks.get(userId)?.get(trackId);
      if (!consumer) {
        throw new Error(
          `Consumer not found for user ${userId} and trackId ${trackId}`,
        );
      }

      await consumer.resume();
      return { success: true };
    } catch (error) {
      console.error("Failed to unpause consumer", error);
      throw error;
    }
  }

  async createAgentConsumerTrack({
    rtpCap,
    transport,
    trackId,
  }: {
    rtpCap: RtpCapabilities;
    transport: DirectTransport;
    trackId: string;
  }) {
    const consumer = await transport.consume({
      producerId: trackId,
      rtpCapabilities: rtpCap,
      paused: false,
    });

    this._agentConsumerTrack = consumer;
    return consumer;
  }

  async createAgentProducerTrack({
    transport,
    listenerTrack,
  }: {
    transport: DirectTransport;
    listenerTrack: Consumer;
  }) {
    const producerTrack = await transport.produce({
      kind: "audio",
      rtpParameters: listenerTrack.rtpParameters,
    });

    this._agentProducerTrack = producerTrack;
    return producerTrack;
  }

  /**
   * Close tracks for specific user (client) or all if no userId is provided.
   */
  closeTrack(userId?: string) {
    if (userId) {
      // close client tracks for a single user
      const producers = this._clientProducerTracks.get(userId);
      const consumers = this._clientConsumerTracks.get(userId);

      producers?.forEach((p) => p.close());
      consumers?.forEach((c) => c.close());

      this._clientProducerTracks.delete(userId);
      this._clientConsumerTracks.delete(userId);
      return;
    }

    // close ALL client tracks
    for (const kindMap of this._clientProducerTracks.values()) {
      kindMap.forEach((p) => p.close());
    }
    for (const consumerMap of this._clientConsumerTracks.values()) {
      consumerMap.forEach((c) => c.close());
    }
    this._clientProducerTracks.clear();
    this._clientConsumerTracks.clear();

    // close agent tracks
    this._agentConsumerTrack?.close();
    this._agentProducerTrack?.close();
    this._agentConsumerTrack = null;
    this._agentProducerTrack = null;
  }

  // --- getters / helpers ---

  get agentProducerTrack() {
    return this._agentProducerTrack;
  }

  get agentConsumerTrack() {
    return this._agentConsumerTrack;
  }

  getClientProducerTrack(userId: string, kind: MediaKind): Producer | undefined {
    return this._clientProducerTracks.get(userId)?.get(kind);
  }

  getClientConsumerTrack(
    userId: string,
    trackId: string,
  ): Consumer | undefined {
    return this._clientConsumerTracks.get(userId)?.get(trackId);
  }
}
