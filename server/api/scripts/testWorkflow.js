#!/usr/bin/env node
/**
 * End-to-end workflow harness that mimics a typical founder session.
 * Requires the API server (and optional AI worker) to be running.
 *
 * Usage:
 *   API_BASE_URL=http://localhost:8080/api \
 *   node scripts/testWorkflow.js
 *
 * Optional environment variables:
 *   TEST_EMAIL, TEST_PASSWORD, TEST_NAME     → override default user credentials
 *   AI_RESULT_TIMEOUT_MS (default 90000)     → overall timeout while waiting for AI result
 *   AI_POLL_INTERVAL_MS (default 3000)       → polling interval for AI result endpoint
 */

import crypto from "node:crypto";
import process from "node:process";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080/api";
const AI_RESULT_TIMEOUT_MS = Number(process.env.AI_RESULT_TIMEOUT_MS ?? 90000);
const AI_POLL_INTERVAL_MS = Number(process.env.AI_POLL_INTERVAL_MS ?? 3000);

const randomSuffix = crypto.randomUUID().split("-")[0];
const defaultEmail = `workflow+${randomSuffix}@growthmonitor.dev`;
const TEST_EMAIL = process.env.TEST_EMAIL ?? defaultEmail;
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "Password123!";
const TEST_NAME = process.env.TEST_NAME ?? "Workflow Tester";

const COOKIE_JAR = {};
let accessToken = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const serializeCookies = () =>
  Object.entries(COOKIE_JAR)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

const captureCookies = (response) => {
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  if (!cookies || cookies.length === 0) {
    return;
  }

  for (const cookie of cookies) {
    const [pair] = cookie.split(";");
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      COOKIE_JAR[key.trim()] = value.trim();
    }
  }
};

const parseResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from ${response.url}: ${text.substring(0, 200)}`,
    );
  }
};

const request = async (method, path, { body, headers = {}, auth = true } = {}) => {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (body && !(body instanceof Buffer) && !(body instanceof ArrayBuffer) && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const cookieHeader = serializeCookies();
  if (cookieHeader) {
    requestHeaders.Cookie = cookieHeader;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body:
      body && requestHeaders["Content-Type"] === "application/json"
        ? JSON.stringify(body)
        : body,
  });

  captureCookies(response);

  if (!response.ok) {
    const payload = await parseResponse(response).catch(() => null);
    const description =
      payload && typeof payload === "object"
        ? JSON.stringify(payload)
        : `${response.status} ${response.statusText}`;
    throw new Error(`Request failed: ${method} ${url} → ${description}`);
  }

  return parseResponse(response);
};

const registerUser = async () => {
  console.log("➡️  Registering new user…");
  try {
    const payload = await request("POST", "/auth/register", {
      auth: false,
      body: {
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });
    accessToken = payload?.accessToken ?? null;
    console.log("   ✅ Registered:", payload?.user?.email);
  } catch (error) {
    if (error.message.includes("409")) {
      console.log("   ⚠️  User already exists, will log in.");
      await loginUser();
      return;
    }
    throw error;
  }
};

const loginUser = async () => {
  console.log("➡️  Logging in…");
  const payload = await request("POST", "/auth/login", {
    auth: false,
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });
  accessToken = payload?.accessToken ?? null;
  console.log("   ✅ Logged in. Access token acquired.");
};

const verifyProfile = async () => {
  console.log("➡️  Fetching profile…");
  const payload = await request("GET", "/auth/me");
  console.log("   ✅ Profile:", payload?.user?.email, payload?.user?.role);
};

const createSale = async () => {
  console.log("➡️  Creating sample sale…");
  await request("POST", "/sales", {
    body: {
      date: new Date().toISOString(),
      product: "Workflow Test Package",
      amount: 1234.56,
      channel: "Direct",
    },
  });
  const payload = await request("GET", "/sales");
  console.log("   ✅ Sales total:", payload?.sales?.length ?? 0);
};

const createCampaign = async () => {
  console.log("➡️  Creating marketing campaign…");
  await request("POST", "/campaigns", {
    body: {
      name: "Workflow Launch Campaign",
      platform: "LinkedIn",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      responses: 42,
      spend: 987.65,
    },
  });
  const payload = await request("GET", "/campaigns");
  console.log("   ✅ Campaigns total:", payload?.campaigns?.length ?? 0);
};

const createInsight = async () => {
  console.log("➡️  Saving insight…");
  await request("POST", "/insights", {
    body: {
      title: "Workflow Automation Insight",
      summary: "Automated run confirms API + worker integration remains healthy.",
      data: { source: "workflow-script", timestamp: Date.now() },
    },
  });
  const payload = await request("GET", "/insights");
  console.log("   ✅ Insights total:", payload?.insights?.length ?? 0);
};

const refreshToken = async () => {
  console.log("➡️  Refreshing access token…");
  const payload = await request("POST", "/auth/refresh", { auth: false });
  accessToken = payload?.accessToken ?? accessToken;
  console.log("   ✅ Access token refreshed.");
};

const waitForAiResult = async (jobId) => {
  const startedAt = Date.now();
  console.log(`➡️  Waiting for AI job ${jobId}…`);

  while (Date.now() - startedAt < AI_RESULT_TIMEOUT_MS) {
    await sleep(AI_POLL_INTERVAL_MS);
    try {
      const payload = await request("GET", `/ai/result/${jobId}`);
      if (payload?.content) {
        console.log("   ✅ AI result received.");
        return payload;
      }
    } catch (error) {
      // Check if it's a 404 (result not ready) or other error
      if (error.message && (error.message.includes("404") || error.message.includes("Result not ready"))) {
        // Result not ready yet; continue polling.
        continue;
      }
      // For other errors, throw immediately
      console.error(`   ❌ Error fetching AI result: ${error.message}`);
      throw error;
    }
  }

  throw new Error(
    `Timed out waiting for AI result after ${AI_RESULT_TIMEOUT_MS}ms`,
  );
};

const runAiWorkflow = async () => {
  console.log("➡️  Enqueuing AI query…");
  const payload = await request("POST", "/ai/query", {
    body: {
      query: "Summarise my latest growth performance and list next steps.",
      context: { source: "workflow-script" },
    },
  });

  const jobId = payload?.jobId;
  if (!jobId) {
    throw new Error("AI query did not return a jobId");
  }

  const result = await waitForAiResult(jobId);
  console.log("   🤖 AI response preview:");
  console.log(result.content.slice(0, 400));
};

const logoutUser = async () => {
  console.log("➡️  Logging out…");
  await request("POST", "/auth/logout", { auth: false });
  accessToken = null;
  console.log("   ✅ Logged out.");
};

const confirmRefreshRevocation = async () => {
  console.log("➡️  Confirming refresh token revocation…");
  try {
    await request("POST", "/auth/refresh", { auth: false });
    throw new Error("Refresh succeeded unexpectedly after logout");
  } catch (error) {
    if (error.message.includes("401")) {
      console.log("   ✅ Refresh token correctly rejected after logout.");
      return;
    }
    throw error;
  }
};

const checkServices = async () => {
  console.log("🔍 Checking required services...");
  let allServicesUp = true;

  // Check Database
  try {
    const response = await fetch("http://localhost:8080/healthz");
    if (response.ok) {
      console.log("   ✅ Database connection (via API healthz)");
    } else {
      throw new Error("Health check failed");
    }
  } catch (error) {
    console.error("   ❌ Database connection failed");
    allServicesUp = false;
  }

  // Check Redis
  try {
    // We'll check Redis by attempting to register a user
    // If Redis is down, rate limiting will fail gracefully
    console.log("   ⚠️  Redis will be tested during workflow");
  } catch (error) {
    console.log("   ⚠️  Redis status unknown");
  }

  // Check GCP Bucket
  try {
    // We'll check GCP during the upload test
    console.log("   ⚠️  GCP Storage will be tested during upload");
  } catch (error) {
    console.log("   ⚠️  GCP Storage status unknown");
  }

  if (!allServicesUp) {
    console.error("\n❌ Some required services are down. Please check the logs above.");
    process.exit(1);
  }

  console.log("");
};

const testConnections = async () => {
  console.log("Testing connections...");

  // Test API server connection
  try {
    const response = await fetch("http://localhost:8080/healthz");
    if (!response.ok) {
      throw new Error(`API health check failed with status ${response.status}`);
    }
    console.log("   ✅ API server connection successful");
  } catch (error) {
    console.error("   ❌ API server connection failed:", error.message);
    process.exit(1);
  }

  // Test AI worker connection
  try {
    const response = await fetch("http://localhost:8001/healthz");
    if (!response.ok) {
      throw new Error(`AI worker health check failed with status ${response.status}`);
    }
    console.log("   ✅ AI worker connection successful");
  } catch (error) {
    console.error("   ❌ AI worker connection failed:", error.message);
    process.exit(1);
  }
};

const testAuthEndpoints = async () => {
  console.log("Testing authentication endpoints...");

  // Test user registration
  try {
    const payload = await request("POST", "/auth/register", {
      body: {
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      auth: false,
    });

    if (!payload || !payload.user || !payload.accessToken) {
      throw new Error("User registration failed: missing user or access token");
    }

    accessToken = payload.accessToken;
    console.log("   ✅ User registration successful");
  } catch (error) {
    if (error.message.includes("409")) {
      console.log("   ⚠️  User already exists, proceeding to login");
    } else {
      console.error("   ❌ User registration test failed:", error.message);
      process.exit(1);
    }
  }

  // Test user login
  try {
    const payload = await request("POST", "/auth/login", {
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      auth: false,
    });

    if (!payload || !payload.accessToken) {
      throw new Error("User login failed: missing access token");
    }

    accessToken = payload.accessToken;
    console.log("   ✅ User login successful");
  } catch (error) {
    console.error("   ❌ User login test failed:", error.message);
    process.exit(1);
  }
};

const testUploadEndpoint = async () => {
  console.log("Testing upload endpoint...");

  try {
    const formData = new FormData();
    formData.append("file", new Blob(["test file content"]), "test.txt");

    const payload = await request("POST", "/upload", {
      body: formData,
    });

    if (!payload || !payload.url) {
      throw new Error("File upload failed: missing file URL");
    }

    console.log("   ✅ File upload successful");
  } catch (error) {
    if (error.message.includes("503") || error.message.includes("File storage not configured")) {
      console.log("   ⚠️  File upload skipped (GCP not configured)");
    } else {
      console.error("   ❌ File upload test failed:", error.message);
      process.exit(1);
    }
  }
};

const testAiWorkerWorkflow = async () => {
  console.log("Testing AI worker workflow...");

  let jobId;

  // Submit a job to the AI worker
  try {
    const payload = await request("POST", "/ai/query", {
      body: {
        query: "What are the latest trends in the market?",
      },
    });

    if (!payload || !payload.jobId) {
      throw new Error("AI job submission failed: missing job ID");
    }

    jobId = payload.jobId;
    console.log("   ✅ AI job submission successful");
  } catch (error) {
    console.error("   ❌ AI job submission test failed:", error.message);
    process.exit(1);
  }

  // Poll for the AI result
  try {
    const startTime = Date.now();
    while (Date.now() - startTime < AI_RESULT_TIMEOUT_MS) {
      try {
        const payload = await request("GET", `/ai/result/${jobId}`);
        if (payload && payload.content) {
          console.log("   ✅ AI result received");
          return;
        }
      } catch (error) {
        if (!error.message.includes("404")) {
          throw error;
        }
      }

      await sleep(AI_POLL_INTERVAL_MS);
    }

    throw new Error("AI result timed out");
  } catch (error) {
    console.error("   ❌ AI result test failed:", error.message);
    process.exit(1);
  }
};

const main = async () => {
  console.log("🚀 Starting GrowthMonitor workflow test");
  console.log("   API base URL:", API_BASE_URL);
  console.log("   Test user:", TEST_EMAIL);
  console.log("");

  await checkServices();

  await testConnections();
  console.log("");

  await registerUser();
  console.log("");
  await sleep(1000);

  await verifyProfile();
  console.log("");
  await sleep(1000);

  await createSale();
  console.log("");
  await sleep(1000);

  await createCampaign();
  console.log("");
  await sleep(1000);

  await createInsight();
  console.log("");
  await sleep(1000);

  await testUploadEndpoint();
  console.log("");
  await sleep(1000);

  await runAiWorkflow();
  console.log("");
  await sleep(1000);

  await refreshToken();
  console.log("");
  await sleep(1000);

  await logoutUser();
  console.log("");
  await sleep(1000);

  await confirmRefreshRevocation();
  console.log("");

  console.log("✅ Workflow completed successfully.");
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Workflow failed:", error.message);
    process.exit(1);
  });
