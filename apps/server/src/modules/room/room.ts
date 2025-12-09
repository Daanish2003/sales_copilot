import type { Router } from "mediasoup/types";
import type { IUser, JoinRoomResponse } from "@/utils/types";
import { salesCopilotPrompt } from "@/config/prompt"
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

  /**
   * Add or rejoin a participant
   */
  public async addParticipant(user: IUser): Promise<JoinRoomResponse> {
    // User already exists → treat as rejoin
    if (this.participants.has(user.userId)) {
      this.participants.set(user.userId, user);
      return {
        success: true,
        routerRtpCap: this.router.rtpCapabilities,
        message: "Rejoined the room successfully",
      };
    }

    // Room capacity check
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

  /**
   * Remove a participant from the room
   */
  public removeParticipant(userId: string): void {
    this.participants.delete(userId);

    // Optional: Trigger callback for analytics/hooks
    // this.onParticipantRemoved?.(userId);
  }

  /**
   * Get all participant userIds
   */
  public getParticipantIds(): string[] {
    return Array.from(this.participants.keys());
  }

  /**
   * Return the IUser entry (including socketId)
   */
  public getParticipant(userId: string): IUser | null {
    return this.participants.get(userId) ?? null;
  }

  /**
   * Backward compatibility: previous name was wrong
   */
  public getParticipantSocketId(userId: string): IUser | null {
    return this.getParticipant(userId);
  }

  /**
   * Number of participants in room
   */
  public getParticipantCount(): number {
    return this.participants.size;
  }

  /**
   * Does this room contain this user?
   */
  public hasParticipant(userId: string): boolean {
    return this.participants.has(userId);
  }

  /**
   * Check if the room has zero participants
   */
  public isEmpty(): boolean {
    return this.participants.size === 0;
  }

  /**
   * Called when RoomManager determines the room should be destroyed.
   * Cleans router + internal maps.
   */
  public async close(): Promise<void> {
    try {
      if (this.router) {
        try {
          this.router.close?.();
        } catch {}
      }
    } catch {}

    // Clear participants
    this.participants.clear();
  }
}
