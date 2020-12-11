import * as jwt from "jsonwebtoken";
import * as socketio from "socket.io";
import * as redisAdapter from "socket.io-redis";
import { config } from "../config";
import { logger } from "../logger";
import { getNewRedis } from "./redis";

let io: socketio.Server;

export const initWebsocket = (server, app) => {
  const adapter = redisAdapter({
    pubClient: getNewRedis(),
    subClient: getNewRedis(),
  });
  // @ts-ignore
  adapter.prototype.on("error", (err) => logger.error("Socket redis adapter encountered an error", { err }));

  io = socketio(server, {
    adapter,
  });

  io.on("connection", (socket) => {
    logger.debug(`A client has connected`, { socketid: socket.id });
    socket.on("disconnect", () => logger.debug("A user has disconnected"));
    socket.on("chat message", (msg) => {
      logger.debug(`Message: ${msg}`, { userId: socket.request.userId });
      io.emit("chat message", msg);
    });
  });

  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    let data;
    try {
      data = jwt.verify(token, config.appKeys[0]);
    } catch (err) {
      logger.debug("Could not validate token", { token });
      return next();
    }

    logger.debug("Decoded token", { data: JSON.stringify(data) });
    socket.request.userId = data.userId;
    return next();
  });
};

export const closeWebsocket = () => {
  io.close();
  io = null;
};
