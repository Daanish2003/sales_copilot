import { EventEmitter } from "events";
import type { IUser } from "@/utils/types";
import { User } from "@/modules/user";

class UserManager extends EventEmitter {
  private static _instance: UserManager;
  private byUserId = new Map<string, User>();
  private bySocketId = new Map<string, User>();

  private constructor() { super(); }

  static getInstance() {
    if (!UserManager._instance) UserManager._instance = new UserManager();
    return UserManager._instance;
  }

  addOrUpdate(iuser: IUser): User {
    const existing = this.byUserId.get(iuser.userId);
    if (existing) {
      const oldSocket = existing.getSocketId();
      if (oldSocket !== iuser.socketId) {
        this.bySocketId.delete(oldSocket);
        existing.setSocketId(iuser.socketId);
        this.bySocketId.set(iuser.socketId, existing);
      }
      this.emit("userUpdated", existing);
      return existing;
    }
    const user = new User(iuser);
    this.byUserId.set(user.getId(), user);
    this.bySocketId.set(user.getSocketId(), user);
    this.emit("userAdded", user);
    return user;
  }

  getByUserId(userId: string) { return this.byUserId.get(userId)|| null; }
  getBySocketId(socketId: string) { return this.bySocketId.get(socketId); }
  hasUser(userId: string) { return this.byUserId.has(userId); }

  async removeBySocketId(socketId: string) {
    const u = this.bySocketId.get(socketId);
    if (!u) return;
    this.bySocketId.delete(socketId);
    this.byUserId.delete(u.getId());
    await u.destroy();
    this.emit("userRemoved", u);
  }

  async removeByUserId(userId: string) {
    const u = this.byUserId.get(userId);
    if (!u) return;
    this.byUserId.delete(userId);
    this.bySocketId.delete(u.getSocketId());
    await u.destroy();
    this.emit("userRemoved", u);
  }

  getAgents() {
    return Array.from(this.byUserId.values()).filter(u => u.isAgent());
  }

  getAll() { return Array.from(this.byUserId.values()); }

}

export const userManager = UserManager.getInstance();
