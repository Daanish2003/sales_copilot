export type User = {
    userId: string;
    name: string;
    socketId: string;
    role: "user" | "agent";
}