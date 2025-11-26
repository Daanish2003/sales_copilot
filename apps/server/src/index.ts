import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import { Server as IOServer } from "socket.io"

const app = express();
const server = http.createServer(app)

const io = new IOServer(server, {
	  cors: {
	      origin: process.env.FRONTEND_URL || "*",
		  methods: ["GET", "POST"],
		  credentials: true,
		  allowedHeaders: ["Content-Type", "Authorization"],
		},
	  transports: ["websocket", "polling"],
	  pingTimeout: 60_000,
	  pingInterval: 25_000,
	  allowEIO3: true,
	});

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "",
		methods: ["GET", "POST", "OPTIONS"],
	}),
);

app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).send("OK");
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
