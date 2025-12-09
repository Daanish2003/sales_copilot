import type { Router, RtpCapabilities } from "mediasoup/types";
import { MediaTransport } from "../media/media-transport";
import { MediaTrack } from "../media/media-track";

interface JoinRoomResponse {
  success: boolean;
  message: string;
  routerRtpCap?: RtpCapabilities;
}

export class Room {
  public readonly roomId: string;
  public readonly authorId: string;
  public readonly prompt: string;
  public readonly router: Router;
  private participants: Map<string, string>;
  public readonly maxParticipants: number;

  public mediaTransports: MediaTransport;
  public mediaTracks: MediaTrack;

  constructor(
    roomId: string,
    authorId: string,
    router: Router,
    maxParticipants = 2 
  ) {
    this.roomId = roomId;
    this.authorId = authorId;
    this.router = router;
    this.prompt = salesCopilotPrompt;
    this.maxParticipants = maxParticipants;

    this.participants = new Map();
    this.mediaTransports = new MediaTransport();
    this.mediaTracks = new MediaTrack();
  }

  public async addParticipant(
    userId: string,
    socketId: string
  ): Promise<JoinRoomResponse> {
    if (this.participants.has(userId)) {
      this.participants.set(userId, socketId);

      return {
        success: true,
        routerRtpCap: this.router.rtpCapabilities,
        message: "Rejoined the room successfully",
      };
    }

    if (this.participants.size >= this.maxParticipants) {
      return {
        success: false,
        message: "Room is full",
      };
    }

    this.participants.set(userId, socketId);

    const routerRtpCap = this.router.rtpCapabilities;

    return {
      success: true,
      routerRtpCap,
      message: "You have successfully joined the room",
    };
  }

  public removeParticipant(userId: string): void {
    this.participants.delete(userId);
  }

  public getParticipantIds(): string[] {
    return Array.from(this.participants.keys());
  }

  public getParticipantSocketId(userId: string): string | undefined {
    return this.participants.get(userId);
  }

  public getParticipantCount(): number {
    return this.participants.size;
  }

  public hasParticipant(userId: string): boolean {
    return this.participants.has(userId);
  }
}
