import type { IUser } from "@/utils/types";
import type { DefaultEventsMap } from "socket.io/dist/typed-events";

declare module "socket.io" {
	interface Socket<
		ListenEvents extends DefaultEventsMap = DefaultEventsMap,
		EmitEvents extends DefaultEventsMap = DefaultEventsMap,
		ServerSideEvents extends DefaultEventsMap = DefaultEventsMap,
		SocketData = any,
	> {
		user: IUser;
		__msgCountWindowStart?: number;
		__msgCountInWindow?: number;
	}
}