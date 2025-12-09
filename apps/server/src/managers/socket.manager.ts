import { Server as SocketServer, Socket } from "socket.io";
import type { DtlsParameters, IceCandidate, IceParameters, MediaKind, RtpCapabilities, RtpParameters } from "mediasoup/types";
import { logger } from "@/utils/logger";
import { roomManager } from "./room.manager";


interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

interface JoinRoomResponse {
  success: boolean;
  message: string;
  routerRtpCap?: RtpCapabilities;
}

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

		socket.user = {
			name: userData.name,
			socketId: socket.id,
			userId: userData.userId,
      role: userData.role
		};
		next();
	}


  private extractToken(
		socket: Socket
	): { name: string; userId: string, role: "user" | "agent" } | null {
		const aTok = socket.handshake.auth.token;
		if (aTok) {
			return this.normalizeToken(aTok);
		}
		return null;
	}

	private normalizeToken(
		token: string | string[]
	): { name: string; userId: string, role: "user" | "agent" } | null {
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
			logger.error("Error handling socket connection", {
				error,
				name: socket.user.name,
				socketId: socket.id,
			});
			socket.emit("error", { message: "Failed to connect" });
			socket.disconnect(true);
		}
	}

	private handleReconnection(newSocket: Socket, oldSocket: Socket): void {
		const userId = newSocket.user.userId;

		try {
			logger.info("Handling reconnection", {
				userId,
				oldSocketId: oldSocket.id,
				newSocketId: newSocket.id,
			});

			const room = roomManager.findRoomByUser(userId);

			this.sockets.delete(oldSocket.id);
			this.sockets.set(newSocket.id, newSocket);
			this.userSocketMap.set(userId, newSocket.id);

			if (room) {
				room.playerManager.updatePlayerSocketId(userId, newSocket.id);
				newSocket.join(room.id);

				logger.info("User rejoined previous room", {
					roomId: room.id,
					userId,
					newSocketId: newSocket.id,
				});

				const remaining = room.gameManager.getRemainingCooldown(userId);
				if (remaining > 0) {
					newSocket.emit("restriction-active", {
						message: "You're still on cooldown.",
						remaining,
					});
					logger.info("Restriction active for reconnected user", {
						userId,
						roomId: room.id,
						remaining,
					});
				}

				const io = this.getIO();
				if (io) {
					io.to(room.id).emit("player-reconnected", {
						userId,
						name: newSocket.user.name,
					});
				}
			} else {
				logger.warn("Reconnection attempted but room not found for user", {
					userId,
				});
			}

			oldSocket.removeAllListeners();
			oldSocket.disconnect(true);

			this.setupSocketEventHandlers(newSocket);

			newSocket.emit("reconnected", {
				message: "Reconnected successfully",
				userId,
				socketId: newSocket.id,
			});
		} catch (error) {
			logger.error("Error handling reconnection", { error, userId });
			newSocket.emit("error", { message: "Failed to reconnect" });
		}
	}

   private async handleJoinRoom(
    socket: Socket,
    { roomId, userId }: JoinRoomPayload,
    callback: (response: JoinRoomResponse) => void
  ) {
    try {
      if(socket.user.role !== "user"){
        const response = await roomManager.createRoom(roomId, userId);
      }
      const response = await roomManager.joinRoom(roomId, userId, socket.id);
      callback(response);
    } catch (error) {
      console.error("Error in joining room:", error);
      callback({
        success: false,
        message: "Connection error failed to join room",
      });
    }
  }

  setupSocketEventHandlers(socket: Socket) {
    socket.on("joinRoom", this.handleJoinRoom.bind(this, socket));

    socket.on(
      "createProducerTransport",
      async (
        { roomId }: { roomId: string },
        callback: (response: {
          clientTransportParams: {
            id: string;
            iceParameters: IceParameters;
            iceCandidates: IceCandidate[];
            dtlsParameters: DtlsParameters;
          };
        }) => void
      ) => {
        const room = roomManager.getRoom(roomId)
        if(!room) {
          throw new Error("CreateProducerRequest: Room not found")
        }

        const clientTransportParams = await room.mediaTransports.createClientProducerTransport(room.router)
        callback({ clientTransportParams });
      }
    );

    socket.on(
      "connect-producer-transport",
      async (
        { roomId, dtlsParameters }: { roomId: string; dtlsParameters: DtlsParameters },
        callback: (response: { success: boolean }) => void
      ) => {
        const room = roomManager.getRoom(roomId)

        if(!room) {
          throw new Error("ConnectProducerRequest: Room not found")
        }
        await room.mediaTransports.connectClientProducerTransport({
          dtlsParameters
        })

        callback({ success: true });
      }
    );

    socket.on(
      "createConsumerTransport",
      async (
        { roomId }: { roomId: string },
        callback: (response: {
          clientTransportParams: {
            id: string;
            iceParameters: IceParameters;
            iceCandidates: IceCandidate[];
            dtlsParameters: DtlsParameters;
          };
        }) => void
      ) => {
        const room = roomManager.getRoom(roomId)

        if(!room) {
          throw new Error("CreateConsumerRequest: Room not found")
        }

        const clientTransportParams = await room.mediaTransports.createClientConsumerTransport(room.router)
        callback({ clientTransportParams });
      }
    );

    socket.on(
      "connect-consumer-transport",
      async (
        { roomId, dtlsParameters }: { roomId: string; dtlsParameters: DtlsParameters },
        callback: (response: { success: boolean }) => void
      ) => {
        const room = roomManager.getRoom(roomId)
        if(!room) {
          throw new Error("ConnectConsumerRequest: Room not found")
        }
        await room.mediaTransports!.connectClientConsumerTransport({
          dtlsParameters
        })
        callback({ success: true });
      }
    );

    socket.on(
      "start-produce",
      async (
        { roomId, kind, rtpParameters }: { roomId: string; kind: MediaKind; rtpParameters: RtpParameters },
        callback: ({ id }: { id: string }) => void
      ) => {
        const room = roomManager.getRoom(roomId)
        if(!room) {
          throw new Error("StartProducingRequest: Room not found")
        }

        const id = await room.mediaTracks.createClientProducerTrack({
          kind,
          rtpParameters,
          transport: room.mediaTransports.clientProducerTransport!,
        })
        const transport = await room.mediaTransports.createAgentTransport(room.router)
        const Ctrack = await room.mediaTracks.createAgentConsumerTrack({
          transport: transport,
          rtpCap: room.router.rtpCapabilities,
          trackId: id
        })

        const Ptrack = await room.mediaTracks.createAgentProducerTrack({
          transport,
          listenerTrack: Ctrack
        })

        const ssrc = Ctrack.rtpParameters.encodings![0]!.ssrc!  

        const agent = new AgentPipeline(room.prompt, Ptrack, ssrc)
        room.addAgent(agent)
        agent?.setSocket(socket)

        Ctrack.on('rtp', (rtpPackets) => {
          agent.stream(rtpPackets)
        })
        callback({ id });
      }
    );

    socket.on(
      "consume-media",
      async (
        { roomId, rtpCapabilities }: { roomId: string; rtpCapabilities: RtpCapabilities },
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
      ) => {
        const room = roomManager.getRoom(roomId)

        if(!room) {
          throw new Error("ConsumeMediaRequest: Room not found")
        }

        const response = await room.mediaTracks.createClientConsumerTrack({
          rtpCap: rtpCapabilities,
          router: room.router,
          trackId: room.mediaTracks.agentProducerTrack!.id,
          transport: room.mediaTransports.clientConsumerTransport!
        }) 

  
        callback(response);
      }
    );

    socket.on(
      "unpauseConsumer",
      async (
        { roomId }: { roomId: string },
        callback: ({ success }: { success: boolean }) => void
      ) => {
        const room = roomManager.getRoom(roomId)

        if(!room) {
          throw new Error("ConsumeMediaRequest: Room not found")
        }
        const response = await room.mediaTracks.unpauseConsumer()!;
        callback(response);
      }
    );

    socket.on(
      "exit-room",
      async(
        {roomId} : {roomId: string},
      ) => {
        const room = roomManager.getRoom(roomId)

        if(room) {
          room.agent?.closeStream()
          room.mediaTracks.closeTrack()
          room.mediaTransports.closeTransport()
          roomManager.removeRoom(room.roomId)
        }
      }
    )

    socket.on("disconnect", async () => {
        try {
            console.log("Client Disconnected");
            this.connections.delete(socket.id);

            const room = roomManager.getRoomBySocketId(socket.id)

            if(room) {
              room.agent?.closeStream()
              room.mediaTracks.closeTrack()
              room.mediaTransports.closeTransport()
              roomManager.removeRoom(room.roomId)
            }

          } catch (error) {
            console.error("Error during disconnection cleanup:", error);
          }
    });
  }
}
