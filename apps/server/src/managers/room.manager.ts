import { config } from "@/config/media-config";
import { routerManager } from "./route.manager";
import { mediasoupWorkerManager } from "./worker.manager";
import { Room } from "@/modules/room/room";


class RoomManager {
    private static instance: RoomManager
    private rooms: Map<string, Room>;

    constructor() {     
        this.rooms = new Map();
    }

    public static getInstance() {
      if(!RoomManager.instance) {
        RoomManager.instance = new RoomManager()
      }

      return RoomManager.instance
    }

    async createRoom(roomId: string, userId: string) {
      if(!roomManager.hasRoom(roomId)) {
              try {
                  const worker = await mediasoupWorkerManager.getAvailableWorker()
                  const router = await worker.createRouter(config.mediasoup.router)
                  routerManager.addRouter(router)
                  const room= new Room(roomId, userId, router);
                  this.rooms.set(room.roomId, room)
              } catch (error) {
                  throw new Error(`Room Manager Failed to create room: ${error}`)
              }
          }
    }

    async joinRoom(roomId: string, userId: string, socketId: string) {
      if (!this.hasRoom(roomId)) {
        return {
            success: false,
            message: "Room not found",
        }
      }
      
      const room = this.getRoom(roomId);
  
      const response  = await room!.addParticipant(userId, socketId)
  
      return response
  }

    hasRoom(roomId: string) {
      return this.rooms.has(roomId)
    }

    addRoom(room: Room) {
      this.rooms.set(room.roomId, room)
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId)
    }

    removeRoom(roomId: string) {
      this.rooms.delete(roomId)
    }

    findRoomByUser(userId: string): Room | null {
      for (const room of this.rooms.values()) {
          if (room.hasParticipant(userId)) {
              return room;
          }
      }
      return null;
    }
}

export const roomManager = RoomManager.getInstance()