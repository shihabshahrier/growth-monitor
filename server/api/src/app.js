import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import routes from "./routes/index.js";
import { rateLimiter } from "./middlewares/rateLimiter.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, origin ?? corsOrigins[0]);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.head("/healthz", (req, res) => {
  res.send();
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
