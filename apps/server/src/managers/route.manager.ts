import type { Router } from "mediasoup/types"
import HTTP_STATUS from "http-status";
import { AppError } from "@/utils/errors";

class MediasoupRouterManager {
    private static instance: MediasoupRouterManager
    private routers: Map<string, Router>

    constructor() {
        this.routers = new Map()
    }

    static getInstance() {
        if(!MediasoupRouterManager.instance) {
            MediasoupRouterManager.instance = new MediasoupRouterManager()
        }

        return MediasoupRouterManager.instance
    }

    addRouter(router: Router) {
        try {
            this.routers.set(router.id, router)
        } catch (error) {
            throw new AppError("MediaRouterManager failed to add router", {
                statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                code: "ROUTER_ADD_FAILED",
                cause: error
            })
        }
    }

    getRouter(routerId: string) {
        try {
            const router = this.routers.get(routerId)
            return router
        } catch (error) {
            throw new AppError("MediaRouterManager failed to get router", {
                statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                code: "ROUTER_GET_FAILED",
                cause: error
            })
        }
    }

    hasRouter(routerId: string) {
        return this.routers.has(routerId)
    }
}

export const routerManager = MediasoupRouterManager.getInstance()