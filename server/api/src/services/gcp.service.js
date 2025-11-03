import { Storage } from "@google-cloud/storage";

let bucketInstance = null;

const buildStorage = () => {
  const projectId = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const bucketName = process.env.GCP_BUCKET_NAME;

  if (!projectId || !clientEmail || !privateKey || !bucketName) {
    console.warn("GCP credentials are incomplete. File uploads are disabled.");
    return null;
  }

  const storage = new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });

  return storage.bucket(bucketName);
};

export const getBucket = () => {
  if (bucketInstance) {
    return bucketInstance;
  }

  bucketInstance = buildStorage();
  return bucketInstance;
};
