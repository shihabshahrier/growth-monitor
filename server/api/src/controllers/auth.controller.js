import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAccessExpiryMs,
  getRefreshExpiryMs,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { prisma } from "../services/prisma.service.js";
import { redis } from "../services/redis.service.js";

const buildAccessPayload = (user) => ({
  sub: user.id,
  email: user.email,
  role: user.role,
  companyId: user.companyId
});

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: getRefreshExpiryMs(),
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, refreshCookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", { path: "/" });
};

const revokeRefreshToken = async (token) => {
  if (!token) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });

  if (redis) {
    await redis.sadd("revoked_tokens", token);
  }
};

const createSession = async (user, res) => {
  const accessPayload = buildAccessPayload(user);
  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(accessPayload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + getRefreshExpiryMs()),
    },
  });

  setRefreshCookie(res, refreshToken);

  return { accessToken };
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, companyName, industry } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password required" });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);

  // Create company if provided
  let company = null;
  if (companyName) {
    company = await prisma.company.create({
      data: {
        name: companyName,
        industry: industry || null
      }
    });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      companyId: company?.id || null,
      role: company ? 'OWNER' : 'OWNER' // Default to OWNER
    },
  });

  const session = await createSession(user, res);
  return res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    },
    accessToken: session.accessToken,
    expiresIn: getAccessExpiryMs(),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revoked: false },
    data: { revoked: true },
  });

  const session = await createSession(user, res);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken: session.accessToken,
    expiresIn: getAccessExpiryMs(),
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  if (redis) {
    const isRevoked = await redis.sismember("revoked_tokens", token);
    if (isRevoked) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Token revoked" });
    }
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken || storedToken.revoked || !storedToken.user) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Refresh token not recognized" });
  }

  if (storedToken.expiresAt.getTime() < Date.now()) {
    clearRefreshCookie(res);
    await revokeRefreshToken(token);
    return res.status(401).json({ message: "Refresh token expired" });
  }

  await revokeRefreshToken(token);

  const session = await createSession(storedToken.user, res);
  return res.json({
    accessToken: session.accessToken,
    expiresIn: getAccessExpiryMs(),
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await revokeRefreshToken(token);
  }
  clearRefreshCookie(res);
  return res.status(204).send();
});

export const profile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
});
