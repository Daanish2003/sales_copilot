import type { DirectTransport, DtlsParameters, Router, WebRtcTransport } from "mediasoup/types";
import { config } from "../../config/media-config";

export class MediaTransport {
  private _producerTransports = new Map<string, WebRtcTransport>();
  private _consumerTransports = new Map<string, WebRtcTransport>();
  private _agentTransport: DirectTransport | null = null;

  constructor() {}

  async createClientProducerTransport(router: Router, userId: string) {
    try {
      const transport = await router.createWebRtcTransport(
        config.mediasoup.webRtcTransport,
      );

      const transportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };

      this._producerTransports.set(userId, transport);

      return transportParams;
    } catch (error) {
      console.error("Failed to create producer WebRTC transport", error);
      throw error;
    }
  }

  async connectClientProducerTransport({
    userId,
    dtlsParameters,
  }: {
    userId: string;
    dtlsParameters: DtlsParameters;
  }) {
    try {
      const transport = this._producerTransports.get(userId);

      if (!transport) {
        throw new Error(`Producer WebRTC transport not found for user ${userId}`);
      }

      await transport.connect({ dtlsParameters });
    } catch (error) {
      console.error("Error connecting producer WebRTC transport:", error);
      throw error;
    }
  }

  async createClientConsumerTransport(router: Router, userId: string) {
    try {
      const transport = await router.createWebRtcTransport(
        config.mediasoup.webRtcTransport,
      );

      const transportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };

      this._consumerTransports.set(userId, transport);

      return transportParams;
    } catch (error) {
      console.error("Failed to create consumer WebRTC transport", error);
      throw error;
    }
  }

  async connectClientConsumerTransport({
    userId,
    dtlsParameters,
  }: {
    userId: string;
    dtlsParameters: DtlsParameters;
  }) {
    try {
      const transport = this._consumerTransports.get(userId);

      if (!transport) {
        throw new Error(`Consumer WebRTC transport not found for user ${userId}`);
      }

      await transport.connect({ dtlsParameters });
    } catch (error) {
      console.error("Error connecting consumer WebRTC transport:", error);
      throw error;
    }
  }

  async createAgentTransport(router: Router) {
    try {
      const directTransport = await router.createDirectTransport();
      this._agentTransport = directTransport;
      return directTransport;
    } catch (error) {
      console.error("Failed to create Direct Transport", error);
      throw error;
    }
  }

  /**
   * Close transports for a specific user or all users if no userId provided.
   */
  closeTransport(userId?: string) {
    if (userId) {
      this._producerTransports.get(userId)?.close();
      this._consumerTransports.get(userId)?.close();

      this._producerTransports.delete(userId);
      this._consumerTransports.delete(userId);
      return;
    }

    // Close all
    for (const transport of this._producerTransports.values()) {
      transport.close();
    }
    for (const transport of this._consumerTransports.values()) {
      transport.close();
    }

    this._producerTransports.clear();
    this._consumerTransports.clear();
    // this._agentTransport?.close();
  }

  getProducerTransport(userId: string): WebRtcTransport | undefined {
    return this._producerTransports.get(userId);
  }

  getConsumerTransport(userId: string): WebRtcTransport | undefined {
    return this._consumerTransports.get(userId);
  }

  // get directTransport() {
  //   return this._agentTransport;
  // }
}
