import "dotenv/config";
import http from "http";
import app from "./app.js";
import {
  disconnectPrisma,
  initPrisma,
} from "./services/prisma.service.js";
import {
  disconnectRedis,
  initRedis,
} from "./services/redis.service.js";

const port = Number(process.env.PORT || 8080);

const server = http.createServer(app);

const start = async () => {
  try {
    await initPrisma();
    await initRedis();
    server.listen(port, () => {
      console.log(`API server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectRedis();
    await disconnectPrisma();
    process.exit(0);
  });
};

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

start();
