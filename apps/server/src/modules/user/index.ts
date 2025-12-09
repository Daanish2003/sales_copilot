// user.ts
import type { IUser } from "@/utils/types";
import type { Consumer, Producer, WebRtcTransport } from "mediasoup/types";

export class User {
  private userId: string;
  private userName: string;
  private socketId: string;
  private role: "user" | "agent";
  private producerTransport: WebRtcTransport | null = null;
  private consumerTransport: WebRtcTransport | null = null;
  private producerTrack: Producer | null = null;
  public consumerTracks: Map<string, Consumer> = new Map();
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

  async destroy() {
    try { this.producerTrack?.close?.(); } catch {}
    try { this.producerTransport?.close?.(); } catch {}
    try { this.consumerTransport?.close?.(); } catch {}
    for (const c of this.consumerTracks.values()) {
      try { c.close?.(); } catch {}
    }
    this.consumerTracks.clear();
  }
}
