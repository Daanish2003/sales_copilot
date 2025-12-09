// room.manager.ts
import { config } from "@/config/media-config";
import { routerManager } from "./route.manager";
import { mediasoupWorkerManager } from "./worker.manager";
import { Room } from "@/modules/room/room";
import type { IUser, JoinRoomResponse } from "@/utils/types";
import HTTP_STATUS from "http-status";
import { AppError } from "@/utils/errors";
import { userManager } from "./user.manager";
import { logger } from "@/utils/logger";

class RoomManager {
  private static _instance: RoomManager;
  private readonly rooms = new Map<string, Room>();

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager._instance) RoomManager._instance = new RoomManager();
    return RoomManager._instance;
  }

  public hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  public addRoom(room: Room): void {
    this.rooms.set(room.roomId, room);
  }

  public getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) ?? null;
  }

  public removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /**
   * Create a room (idempotent).
   * Throws AppError on invalid input or internal failure.
   */
  public async createRoom(roomId: string, authorId: string): Promise<void> {
    if (!roomId || !authorId) {
      throw new AppError("roomId and authorId are required", {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: "ROOM_FIELDS_REQUIRED",
      });
    }

    if (this.hasRoom(roomId)) return;

    try {
      const worker = await mediasoupWorkerManager.getAvailableWorker();
      const router = await worker.createRouter(config.mediasoup.router);
      routerManager.addRouter(router);

      const room = new Room(roomId, authorId, router);
      this.addRoom(room);
    } catch (cause) {
      throw new AppError("Room Manager failed to create room", {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: "ROOM_CREATE_FAILED",
        cause,
      });
    }
  }

  /**
   * Ensure global presence is updated, then delegate to Room.addParticipant.
   */
  public async joinRoom(roomId: string, user: IUser): Promise<JoinRoomResponse> {
    if (!this.hasRoom(roomId)) {
      throw new AppError("Room does not exist", {
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: "ROOM_NOT_FOUND",
      });
    }

    const room = this.getRoom(roomId)!; // safe: we checked above

    // Update global user presence (non-throwing by contract ideally)
    try {
      userManager.addOrUpdate(user);
    } catch {
      logger.error(`Failed to update user presence for userId=${user.userId}`);
    }

    return room.addParticipant(user);
  }

  /**
   * Remove participant from a room, clean up their resources, and delete empty rooms.
   */
  public async removeParticipant(roomId: string, userId: string): Promise<void> {
    const room = this.getRoom(roomId);
    if (!room) return;

    // Remove from room
    room.removeParticipant(userId);

    // Clean user resources (transports, producers, consumers)
    try {
      await userManager.removeByUserId(userId);
    } catch {
      logger.error(`Failed to clean up user resources for userId=${userId}`);
    }

    // If room is empty, close and remove it
    if (room.isEmpty() || room.getParticipantCount() === 0) {
      try {
        await room.close();
      } catch {
        // log if needed
      }
      this.removeRoom(roomId);
    }
  }

  /**
   * Convenience for disconnect flows: locate and remove user from their room.
   */
  public async removeUserFromAnyRoom(userId: string): Promise<void> {
    for (const room of this.rooms.values()) {
      if (room.hasParticipant(userId)) {
        await this.removeParticipant(room.roomId, userId);
        return;
      }
    }
  }

  /**
   * Utility: return all rooms (readonly snapshot)
   */
  public getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  public findRoomByUser(userId: string): Room | null {
  for (const room of this.rooms.values()) {
    if (room.hasParticipant(userId)) {
      return room;
    }
  }
  return null;
}
}

export const roomManager = RoomManager.getInstance();
