import { Server as SocketServer, Socket } from "socket.io";
import type { DtlsParameters, IceCandidate, IceParameters, MediaKind, RtpCapabilities, RtpParameters } from "mediasoup/types";
import { logger } from "@/utils/logger";
import { roomManager } from "./room.manager";
import type { CreateConsumerTransportResponse, CreateProducerTransportResponse, JoinRoomPayload, JoinRoomResponse } from "@/utils/types";
import { toAppError } from "@/utils/errors";
import { isProd } from "@/utils/prod";
import { connectClientProducerTransport, createClientProducerTransport } from "@/modules/media/media-transport";
import { userManager } from "./user.manager";
import { createClientConsumerTrack, createClientProducerTrack, unpauseConsumer } from "@/modules/media/media-track";

export class SocketManager {
  private static instance: SocketManager;
  private io: SocketServer | null = null;
  private readonly sockets: Map<string, Socket> = new Map();
  private readonly userSocketMap: Map<string, string> = new Map();

  constructor() {}

  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }

    return SocketManager.instance;
  }

  initialize(io: SocketServer): void {
    this.io = io;
    this.setupMiddleware();
    this.setupConnectionHandler();
  }

  private setupMiddleware(): void {
    this.io?.use(this.authMiddleware.bind(this));
  }

  private authMiddleware(socket: Socket, next: (err?: Error) => void) {
    const userData = this.extractToken(socket);

    if (!userData) {
      return next(new Error("No user data provided"));
    }

    // attach a `user` object to socket (assume typing exists elsewhere)
    socket.user = {
      name: userData.name,
      socketId: socket.id,
      userId: userData.userId,
      role: userData.role,
    };
    next();
  }

  private extractToken(
    socket: Socket
  ): { name: string; userId: string; role: "user" | "agent" } | null {
    const aTok = socket.handshake.auth.token;
    if (aTok) {
      return this.normalizeToken(aTok);
    }
    return null;
  }

  private normalizeToken(
    token: string | string[]
  ): { name: string; userId: string; role: "user" | "agent" } | null {
    const tokenValue = Array.isArray(token) ? token[0] : token;
    if (typeof tokenValue === "string") {
      try {
        const parsed = JSON.parse(tokenValue.trim());
        const { name, userId, role } = parsed;

        if (typeof name === "string" && typeof userId === "string" && (role === "user" || role === "agent")) {
          return { name, userId, role };
        }
        return null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private setupConnectionHandler(): void {
    this.io?.on("connection", this.handleConnection.bind(this));
  }

  getSocketById(socketId: string): Socket | null {
    const socket = this.sockets.get(socketId);

    if (!socket) {
      logger.warn("Socket not found", { socketId });
      return null;
    }

    return socket;
  }

  getSocketByUserId(userId: string): Socket | null {
    const socketId = this.userSocketMap.get(userId);
    if (!socketId) {
      logger.warn("No socket found for user", { userId });
      return null;
    }
    return this.getSocketById(socketId);
  }

  getIO() {
    if (!this.io) {
      logger.error("Socket.io not initialized");
      return null;
    }
    return this.io;
  }

  private handleConnection(socket: Socket) {
    try {
      const userId = socket.user.userId;
      const oldSocketId = this.userSocketMap.get(userId);
      const oldSocket = oldSocketId ? this.sockets.get(oldSocketId) : undefined;

      if (oldSocket && oldSocket.id !== socket.id) {
        logger.info("Detected reconnection attempt", {
          userId,
          oldSocketId,
          newSocketId: socket.id,
        });
        this.handleReconnection(socket, oldSocket);
        return;
      }

      this.sockets.set(socket.id, socket);
      this.userSocketMap.set(userId, socket.id);

      this.setupSocketEventHandlers(socket);

      socket.emit("connected", {
        message: "Connected successfully",
        name: socket.user.name,
        userId: socket.user.userId,
        socketId: socket.id,
        queueStatus: "waiting",
      });

      logger.info("User connected", {
        name: socket.user.name,
        userId,
        socketId: socket.id,
      });
    } catch (error) {
      const appError = toAppError(error, "Failed to handle socket connection", {
        code: "SOCKET_CONNECTION_FAILED",
      });
      logger.error("Error handling socket connection", {
        message: appError.message,
        code: appError.code,
        stack: appError.stack,
        name: socket.user?.name,
        socketId: socket.id,
      });
      socket.emit("error", { message: isProd ? "Failed to connect" : appError.message, code: appError.code });
      socket.disconnect(true);
    }
  }

  private handleReconnection(newSocket: Socket, oldSocket: Socket): void {
  const user = newSocket.user;
  if (!user) {
    newSocket.emit("error", { message: "Invalid reconnection" });
    newSocket.disconnect(true);
    return;
  }

  const userId = user.userId;

  this.sockets.delete(oldSocket.id);
  this.sockets.set(newSocket.id, newSocket);
  this.userSocketMap.set(userId, newSocket.id);

  const room = roomManager.findRoomByUser(userId);
  if (room) {
    newSocket.join(room.roomId);

    const io = this.getIO();
    io?.to(room.roomId).emit("player-reconnected", {
      userId,
      name: user.name,
      socketId: newSocket.id,
    });
  }

  try {
    oldSocket.removeAllListeners();
    if (oldSocket.connected) {
      oldSocket.disconnect(true);
    }
  } catch {}

  this.setupSocketEventHandlers(newSocket);

  newSocket.emit("reconnected", {
    message: "Reconnected successfully",
    userId,
    socketId: newSocket.id,
  });
}

  private async handleJoinRoom(
    socket: Socket,
    { roomId }: { roomId: string },
    callback: (response: JoinRoomResponse) => void
  ) {
    try {
      const response = await roomManager.joinRoom(roomId, socket.user);
      callback(response);
    } catch (error) {
      const appError = toAppError(error, "Failed to join room", {
        code: "JOIN_ROOM_FAILED",
      });
      logger.error("Error in joining room", {
        message: appError.message,
        code: appError.code,
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        stack: appError.stack,
      });
      callback({
        success: false,
        message: isProd && !appError.isOperational ? "Failed to join room" : appError.message,
      });
    }
  }

  private async handleCreateProducerTransport(
    socket: Socket,
    { roomId }: { roomId: string },
    callback: (response: CreateProducerTransportResponse) => void
  ) {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      callback({
        success: false,
        message: "Room not found",
        clientTransportParams: null,
      });
      return;
    }

    try {
      const transportParams = await createClientProducerTransport(room.router);
      const user = userManager.getByUserId(socket.user.userId)

      if(!user) {
        callback({
          success: false,
          message: "User not found",
          clientTransportParams: null,
        })
        return
      }
      user.setProducerTransport(transportParams.transport)
      callback({
        success: true,
        message: "Producer transport created successfully",
        clientTransportParams: transportParams.transportParams,
      });

    } catch (error) {
      const appError = toAppError(error, "Failed to create producer transport", {
        code: "CREATE_PRODUCER_TRANSPORT_FAILED",
      });
      logger.error(appError.message, {
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        code: appError.code,
        stack: appError.stack,
      });
      callback({
        success: false,
        message: isProd && !appError.isOperational ? "Unable to create producer transport" : appError.message,
        clientTransportParams: null,
      });
    }
  }

  private async handleConnectProducerTransport(
    socket: Socket,
    { roomId, dtlsParameters }: { roomId: string; dtlsParameters: DtlsParameters },
    callback: (response: { success: boolean; message: string }) => void
  ) {
    try {
      const user = userManager.getByUserId(socket.user.userId)
      if(!user) {
        callback({
          success: false,
          message: "User not found",
        })
        return
      }
      const producerTransport = user.getProducerTransport()
      if(!producerTransport) {
        callback({
          success: false,
          message: "Producer transport not found",
        })

        return
      }

      await connectClientProducerTransport({
        transport: producerTransport,
        dtlsParameters,
      })

      callback({ success: true, message: "Producer transport connected successfully" });
    } catch (error) {
      const appError = toAppError(error, "Failed to connect producer transport", {
        code: "CONNECT_PRODUCER_TRANSPORT_FAILED",
      });
      logger.error(appError.message, {
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        code: appError.code,
        stack: appError.stack,
      });
      callback({ success: false, message: isProd && !appError.isOperational ? "Unable to connect producer transport" : appError.message });
    }
  }

  private async onCreateConsumerTransport(
    socket: Socket,
    { roomId }: { roomId: string },
    callback: (response: CreateConsumerTransportResponse) => void
  ) {
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return callback({ 
        success: false,
        message: "Room not found",
        clientTransportParams: null 
      });
    }

    try {
      const { transport, transportParams: clientTransportParams } = await createClientProducerTransport(room.router);

      const user = userManager.getByUserId(socket.user.userId)

      if(!user) {
        return callback({
          success: false,
          message: "User not found",
          clientTransportParams: null
        })
      }

      user.setConsumerTransport(transport)
      callback({
        success: true,
        message: "Consumer transport created successfully", 
        clientTransportParams 
      });
    } catch (error) {
      const appError = toAppError(error, "Failed to create consumer transport", {
        code: "CREATE_CONSUMER_TRANSPORT_FAILED",
      });
      logger.error(appError.message, {
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        code: appError.code,
        stack: appError.stack,
      });
      callback({
        success: false,
        message: isProd && !appError.isOperational ? "Unable to create consumer transport" : appError.message,
        clientTransportParams: null
      });
    }
  }

  private async onConnectConsumerTransport(
    socket: Socket,
    { roomId, dtlsParameters }: { roomId: string; dtlsParameters: DtlsParameters },
    callback: (response: { success: boolean }) => void
  ) {
    try {
      const user = userManager.getByUserId(socket.user.userId)
      if(!user) {
        return callback({ success: false });
      }

      const consumerTransport = user.getConsumerTransport()
      if(!consumerTransport) {
        return callback({ success: false });
      }

      await connectClientProducerTransport({
        transport: consumerTransport,
        dtlsParameters,
      })
      callback({ success: true });
    } catch (error) {
      const appError = toAppError(error, "Failed to connect consumer transport", {
        code: "CONNECT_CONSUMER_TRANSPORT_FAILED",
      });
      logger.error(appError.message, {
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        code: appError.code,
        stack: appError.stack,
      });
      callback({ success: false });
    }
  }

  private async onStartProduce(
    socket: Socket,
    { roomId, kind, rtpParameters }: { roomId: string; kind: MediaKind; rtpParameters: RtpParameters },
    callback: ({ id }: { id: string }) => void
  ) {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return callback({ id: "" });
    }

    const user = userManager.getByUserId(socket.user.userId)
    if(!user) {
      return callback({ id: "" });
    }

    const clientProducerTransport = user.getProducerTransport()
    if(!clientProducerTransport) {
      return callback({ id: "" });
    }

    try {
      const producerTrack = await createClientProducerTrack({
        kind,
        rtpParameters,
        transport: clientProducerTransport,
      });

      if(!producerTrack){
        return callback({ id: "" });
      }

      user.setProducerTrack(producerTrack.producer)

      callback({ id: producerTrack.producerId });
    } catch (error) {
      const appError = toAppError(error, "Failed to start produce", {
        code: "START_PRODUCE_FAILED",
      });
      logger.error(appError.message, {
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        code: appError.code,
        stack: appError.stack,
      });
      callback({ id: "" });
    }
  }

  private async onConsumeMedia(
    socket: Socket,
    { roomId, rtpCapabilities, producerId }: { roomId: string; rtpCapabilities: RtpCapabilities, producerId: string },
    callback: (
      response:
        | {
            consumerParams?: {
              producerId: string;
              id: string;
              kind: MediaKind;
              rtpParameters: RtpParameters;
            };
          }
        | { message: string }
    ) => void
  ) {
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return callback({ message: "Room not found" });
    }

    const user = userManager.getByUserId(socket.user.userId)
    if(!user) {
      return callback({ message: "User not found" });
    }

    const clientConsumerTransport = user.getConsumerTransport()
    if(!clientConsumerTransport) {
      return callback({ message: "Consumer transport not found" });
    }
    
    try {
      const response = await createClientConsumerTrack({
        rtpCapabilities: rtpCapabilities,
        router: room.router,
        transport: clientConsumerTransport,
        producerId
      });

      callback(response);
    } catch (error) {
      const appError = toAppError(error, "Failed to consume media", {
        code: "CONSUME_MEDIA_FAILED",
      });
      logger.error(appError.message, {
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        code: appError.code,
        stack: appError.stack,
      });
      callback({ message: isProd && !appError.isOperational ? "Unable to consume media" : appError.message });
    }
  }

  private async onUnpauseConsumer(
    socket: Socket,
    { roomId, consumerId }: { roomId: string; consumerId: string },
    callback: ({ success }: { success: boolean }) => void
  ) {
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return callback({ success: false });
    }

    try {
      const user = userManager.getByUserId(socket.user.userId)

      if(!user) {
        return callback({ success: false });
      }

      // Get the specific consumer track by consumerId
      const consumerTrack = user.getConsumerTrack(consumerId);

      if (!consumerTrack) {
        return callback({ success: false });
      }

      const response = await unpauseConsumer(consumerTrack)
      callback(response);
    } catch (error) {
      const appError = toAppError(error, "Failed to unpause consumer", {
        code: "UNPAUSE_CONSUMER_FAILED",
      });
      logger.error(appError.message, {
        roomId,
        userId: socket.user.userId,
        socketId: socket.id,
        consumerId, // Log which consumer failed
        code: appError.code,
        stack: appError.stack,
      });
      callback({ success: false });
    }
  }

  private async onDisconnect(socket: Socket) {
  try {
    this.sockets.delete(socket.id);

    const userId = socket.user?.userId;
    if (!userId) return;

    if (this.userSocketMap.get(userId) === socket.id) {
      this.userSocketMap.delete(userId);
    }

    const room = roomManager.findRoomByUser(userId);
    if (!room) return;

    // Clean up user resources through userManager
    await userManager.removeByUserId(userId);

    // Remove participant from room
    room.removeParticipant(userId);

    // Remove empty rooms
    if (room.getParticipantCount() === 0) {
      roomManager.removeRoom(room.roomId);
    }
  } catch (error) {
    const appError = toAppError(error, "Failed handling socket disconnect", {
      code: "SOCKET_DISCONNECT_FAILED",
    });
    logger.error(appError.message, { socketId: socket.id, userId: socket.user?.userId, error: appError });
  }
}

// Replace your onExitRoom method with this:

private async onExitRoom(socket: Socket, { roomId }: { roomId: string }) {
  try {
    const room = roomManager.getRoom(roomId);

    if (room) {
      const userId = socket.user.userId;
      await userManager.removeByUserId(userId);
      room.removeParticipant(userId);
      
      if (room.getParticipantCount() === 0) {
        roomManager.removeRoom(room.roomId);
      }
    }
  } catch (error) {
    const appError = toAppError(error, "Failed to exit room", {
      code: "EXIT_ROOM_FAILED",
    });
    logger.error(appError.message, {
      roomId,
      userId: socket.user.userId,
      socketId: socket.id,
      code: appError.code,
      stack: appError.stack,
    });
  }
}

  private handleGetRtpCapabilities(socket: Socket, callback: (response: { rtpCapabilities: RtpCapabilities | null }) => void) {
    const room = roomManager.findRoomByUser(socket.user.userId);
    if (!room) {
      return callback({ rtpCapabilities: null });
    }

    return callback({ rtpCapabilities: room.router.rtpCapabilities });
  }

  setupSocketEventHandlers(socket: Socket) {
    socket.on("joinRoom", this.handleJoinRoom.bind(this, socket));
    socket.on("createProducerTransport", this.handleCreateProducerTransport.bind(this, socket));
    socket.on("connect-producer-transport", this.handleConnectProducerTransport.bind(this, socket));
    socket.on("getRtpCapabilities", this.handleGetRtpCapabilities.bind(this, socket));
    socket.on("createConsumerTransport", this.onCreateConsumerTransport.bind(this, socket));
    socket.on("connect-consumer-transport", this.onConnectConsumerTransport.bind(this, socket));
    socket.on("start-produce", this.onStartProduce.bind(this, socket));
    socket.on("consume-media", this.onConsumeMedia.bind(this, socket));
    socket.on("unpauseConsumer", this.onUnpauseConsumer.bind(this, socket));
    socket.on("exit-room", this.onExitRoom.bind(this, socket));

    socket.on("disconnect", async () => {
      await this.onDisconnect(socket);
    });
  }
}

export const socketManager = SocketManager.getInstance();
