import type { DtlsParameters, IceCandidate, IceParameters, RtpCapabilities } from "mediasoup/types";

export type IUser = {
    userId: string;
    name: string;
    socketId: string;
    role: "user" | "agent";
}

export type JoinRoomPayload = {
  roomId: string;
  userId: string;
}

export type JoinRoomResponse = {
  success: boolean;
  message: string;
  routerRtpCap?: RtpCapabilities;
}

export type CreateProducerTransportResponse = {
    success: boolean;
    message: string;
    clientTransportParams: ClientTransportParams | null;
}

export type ClientTransportParams = {
    id: string;
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
}

export type CreateConsumerTransportResponse = CreateProducerTransportResponse