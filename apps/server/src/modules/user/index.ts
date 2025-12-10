import type { IUser } from "@/utils/types";
import type { Consumer, Producer, WebRtcTransport } from "mediasoup/types";
import type { SalesCopilotAgent, STTCopilotAgent } from "../agent";

export class User {
  private userId: string;
  private userName: string;
  private socketId: string;
  private role: "user" | "agent";
  private producerTransport: WebRtcTransport | null = null;
  private consumerTransport: WebRtcTransport | null = null;
  private producerTrack: Producer | null = null;
  public consumerTracks: Map<string, Consumer> = new Map();
  private sales_copilot_agent: SalesCopilotAgent | null = null;
  private stt_copilot_agent: STTCopilotAgent | null = null; 
  public lastSeen = Date.now();

  constructor(user: IUser) {
    this.userId = user.userId;
    this.userName = user.name;
    this.socketId = user.socketId;
    this.role = user.role;
  }

  getId() { return this.userId; }
  getName() { return this.userName; }
  getSocketId() { return this.socketId; }
  getRole() { return this.role; }
  isAgent() { return this.role === "agent"; }
  addSalesCopilotAgent(agent: SalesCopilotAgent) {
    this.sales_copilot_agent = agent;
  }

  setSocketId(socketId: string) {
    this.socketId = socketId;
    this.lastSeen = Date.now();
  }

  setProducerTransport(t: WebRtcTransport) { this.producerTransport = t; }
  getProducerTransport() { return this.producerTransport; }
  setConsumerTransport(t: WebRtcTransport) { this.consumerTransport = t; }
  getConsumerTransport() { return this.consumerTransport; }
  setProducerTrack(p: Producer) { this.producerTrack = p; }
  getProducerTrack() { return this.producerTrack; }
  getProducerTrackId() { return this.producerTrack?.id; }

  addConsumerTrack(consumer: Consumer) { this.consumerTracks.set(consumer.id, consumer); }
  getConsumerTrack(consumerId: string) { return this.consumerTracks.get(consumerId); }
  removeConsumerTrack(consumerId: string) {
    const c = this.consumerTracks.get(consumerId);
    if (c) {
      try { c.close?.(); } catch { /* ignore */ }
      this.consumerTracks.delete(consumerId);
    }
  }

  async destroy() {
    // Close producer track
    try {
      if (this.producerTrack) {
        this.producerTrack.close?.();
      }
    } catch (err) { /* ignore */ }
    this.producerTrack = null;

    // Close producer transport
    try {
      if (this.producerTransport) {
        this.producerTransport.close?.();
      }
    } catch (err) { /* ignore */ }
    this.producerTransport = null;

    // Close consumer transport
    try {
      if (this.consumerTransport) {
        this.consumerTransport.close?.();
      }
    } catch (err) { /* ignore */ }
    this.consumerTransport = null;

    // Close and clear client consumer tracks
    for (const consumer of this.consumerTracks.values()) {
      try { consumer.close?.(); } catch { /* ignore */ }
    }
    this.consumerTracks.clear();
    // Close and clear agent consumer tracks
  }
}
