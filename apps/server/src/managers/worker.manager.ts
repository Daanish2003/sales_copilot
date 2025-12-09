import os from "os"
import { Worker } from "mediasoup/node/lib/WorkerTypes.js";
import { createMediasoupWorker } from "../functions/media-worker.js";
import HTTP_STATUS from "http-status";
import { AppError } from "@/utils/errors";

class MediasoupWorkerManager {
    private static instance: MediasoupWorkerManager;
    private workers: Map<number, Worker>;
    private totalThreads: number;

    private constructor() {
        this.workers = new Map();
        this.totalThreads = os.cpus().length
    }

    static getInstance(): MediasoupWorkerManager {
        if (!MediasoupWorkerManager.instance) {
            MediasoupWorkerManager.instance = new MediasoupWorkerManager();
        }
        return MediasoupWorkerManager.instance;
    }

    async createWorkers(): Promise<void> {
      for (let i = 0; i < this.totalThreads; i++) {
        const worker = await createMediasoupWorker()
        this.workers.set(i, worker)
      }
    }

    async getAvailableWorker(): Promise<Worker> {
        if (this.workers.size === 0) {
            throw new AppError("No workers available. Please initialize workers first", {
                statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
                code: "WORKER_NOT_INITIALIZED"
            });
        }

        let leastLoadedWorkerIndex: number | null = null;
        let minLoad = Infinity;

        for (const [index, worker] of this.workers) {
            const stats = await worker.getResourceUsage();
            const load = stats.ru_utime + stats.ru_stime;

            if (load < minLoad) {
                minLoad = load;
                leastLoadedWorkerIndex = index;
            }
        }

        if (leastLoadedWorkerIndex === null) {
            throw new AppError("No available worker found", {
                statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
                code: "WORKER_NOT_AVAILABLE"
            });
        }

        return this.getWorker(leastLoadedWorkerIndex)!;
    }

    private getWorker(index: number) {
        return this.workers.get(index)
    }


}

export const mediasoupWorkerManager = MediasoupWorkerManager.getInstance()