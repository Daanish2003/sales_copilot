// agent.ts
import type { Consumer, DirectTransport } from "mediasoup/types";
import { packets, utils } from "rtp.js";
import type { STT } from "./stt/stt";

function clearRTPExtension(rtpPackets: Buffer) {
    const view = utils.nodeBufferToDataView(rtpPackets)
    const { RtpPacket } = packets
    const report = new RtpPacket(view)
    report.clearExtensions()
    const payload = report.getPayload()
    const stream = utils.dataViewToNodeBuffer(payload)
    return stream
}

export class SalesCopilotAgent {
    public id: string;
    public consumerTransport: DirectTransport | null = null;
    public isConnected: boolean = false;
    public consumerTracks: Map<string, Consumer> = new Map();
    public stt: STT | null = null;
    
    constructor(id: string) {
        this.id = id;
    }

    public setConsumerTransport(transport: DirectTransport) {
        this.consumerTransport = transport;
    }

    public addConsumerTrack(userId: string, consumer: Consumer) {
        this.consumerTracks.set(userId, consumer);
    }

    public getConsumerTrack(userId: string) {
        return this.consumerTracks.get(userId);
    }

    public removeConsumerTrack(userId: string) {
        const consumer = this.consumerTracks.get(userId);
        if (consumer) {
            consumer.close();
            this.consumerTracks.delete(userId);
        }
    }

    public setConnected(connected: boolean) {
        this.isConnected = connected;
    }

    public getConsumerTransport() {
        return this.consumerTransport;
    }

    public stream(buffer: Buffer) {
        const audioStream = clearRTPExtension(buffer);

    }

    public close() {
        for (const consumer of this.consumerTracks.values()) {
            try { consumer.close(); } catch {}
        }
        this.consumerTracks.clear();
        this.consumerTransport?.close();
    }

    public reset() {
        this.consumerTransport = null;
        this.isConnected = false;
        this.consumerTracks.clear();
    }
}


export class STTCopilotAgent {
    public id: string;
    public consumerTransport: DirectTransport | null = null;
    public isConnected: boolean = false;
    public consumerTracks: Map<string, Consumer> = new Map();
    
    constructor(id: string) {
        this.id = id;
    }

    public setConsumerTransport(transport: DirectTransport) {
        this.consumerTransport = transport;
    }

    public addConsumerTrack(userId: string, consumer: Consumer) {
        this.consumerTracks.set(userId, consumer);
    }

    public getConsumerTrack(userId: string) {
        return this.consumerTracks.get(userId);
    }

    public removeConsumerTrack(userId: string) {
        const consumer = this.consumerTracks.get(userId);
        if (consumer) {
            consumer.close();
            this.consumerTracks.delete(userId);
        }
    }

    public setConnected(connected: boolean) {
        this.isConnected = connected;
    }

    public getConsumerTransport() {
        return this.consumerTransport;
    }

    public close() {
        for (const consumer of this.consumerTracks.values()) {
            try { consumer.close(); } catch {}
        }
        this.consumerTracks.clear();
        this.consumerTransport?.close();
    }

    public reset() {
        this.consumerTransport = null;
        this.isConnected = false;
        this.consumerTracks.clear();
    }
}