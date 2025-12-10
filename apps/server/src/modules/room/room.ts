// room.ts
import type { Router } from "mediasoup/types";
import type { IUser, JoinRoomResponse } from "@/utils/types";
import { salesCopilotPrompt } from "@/config/prompt";

export class Room {
  public readonly roomId: string;
  public readonly authorId: string;
  public readonly prompt: string;
  public readonly router: Router;
  private participants: Map<string, IUser>;
  public readonly maxParticipants: number;

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
  }

  public async addParticipant(user: IUser): Promise<JoinRoomResponse> {
    if (this.participants.has(user.userId)) {
      this.participants.set(user.userId, user);
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

    this.participants.set(user.userId, user);

    return {
      success: true,
      routerRtpCap: this.router.rtpCapabilities,
      message: "You have successfully joined the room",
    };
  }

  public removeParticipant(userId: string): void {
    this.participants.delete(userId);
  }

  public getParticipantIds(): string[] {
    return Array.from(this.participants.keys());
  }

  public getParticipant(userId: string): IUser | null {
    return this.participants.get(userId) ?? null;
  }

  public getParticipantSocketId(userId: string): IUser | null {
    return this.getParticipant(userId);
  }

  public getParticipantCount(): number {
    return this.participants.size;
  }

  public hasParticipant(userId: string): boolean {
    return this.participants.has(userId);
  }

  public isEmpty(): boolean {
    return this.participants.size === 0;
  }

  public async close(): Promise<void> {
    try {
      try { this.router?.close(); } catch {}
    } catch {}

    this.participants.clear();
  }
}