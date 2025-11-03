import jwt from "jsonwebtoken";
import { parseDurationToMs } from "./duration.js";

const accessSecret = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "refresh-secret";

const accessExpiryValue = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const refreshExpiryValue = process.env.REFRESH_TOKEN_EXPIRY || "7d";

const accessExpiryMs = parseDurationToMs(accessExpiryValue, 15 * 60 * 1000);
const refreshExpiryMs = parseDurationToMs(
  refreshExpiryValue,
  7 * 24 * 60 * 60 * 1000,
);

export const signAccessToken = (payload) =>
  jwt.sign(payload, accessSecret, {
    expiresIn: accessExpiryValue,
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpiryValue,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, accessSecret, { ignoreExpiration: false });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, refreshSecret, { ignoreExpiration: false });

export const getAccessExpiryMs = () => accessExpiryMs;
export const getRefreshExpiryMs = () => refreshExpiryMs;
