#!/usr/bin/env node
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { Storage } from "@google-cloud/storage";

const checkDatabase = async () => {
    try {
        const prisma = new PrismaClient();
        await prisma.$connect();
        await prisma.$disconnect();
        console.log("✅ Database connection successful");
        return true;
    } catch (error) {
        console.log("❌ Database connection failed:", error.message);
        return false;
    }
};

const checkRedis = async () => {
    try {
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        await redis.quit();
        console.log("✅ Redis connection successful");
        return true;
    } catch (error) {
        console.log("❌ Redis connection failed:", error.message);
        return false;
    }
};

const checkGCS = async () => {
    try {
        const projectId = process.env.GCP_PROJECT_ID;
        const clientEmail = process.env.GCP_CLIENT_EMAIL;
        const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");
        const bucketName = process.env.GCP_BUCKET_NAME;

        if (!projectId || !clientEmail || !privateKey || !bucketName) {
            console.log("⚠️  GCS credentials incomplete - upload tests will be skipped");
            return true; // Not a critical failure
        }

        const storage = new Storage({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });

        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();

        if (exists) {
            console.log("✅ GCS bucket accessible");
            return true;
        } else {
            console.log("⚠️  GCS bucket does not exist - upload tests will be skipped");
            return true; // Not a critical failure
        }
    } catch (error) {
        console.log("⚠️  GCS connection failed - upload tests will be skipped:", error.message);
        return true; // Not a critical failure
    }
};

const main = async () => {
    console.log("🔍 Checking service availability...\n");

    const dbOk = await checkDatabase();
    const redisOk = await checkRedis();
    const gcsOk = await checkGCS();

    console.log("");

    if (!dbOk || !redisOk) {
        console.log("❌ Critical services are not available. Please check your configuration.");
        process.exit(1);
    }

    console.log("✅ All critical services are available\n");
    process.exit(0);
};

main();
