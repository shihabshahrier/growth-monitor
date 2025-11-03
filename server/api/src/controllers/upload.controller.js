import { getBucket } from "../services/gcp.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  const bucket = getBucket();
  if (!bucket) {
    return res.status(503).json({ message: "File storage not configured" });
  }

  const timestamp = Date.now();
  const safeName = req.file.originalname.replace(/\s+/g, "_");
  const filePath = `uploads/${timestamp}_${safeName}`;
  const blob = bucket.file(filePath);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: req.file.mimetype,
  });

  blobStream.on("error", (error) => {
    res.status(500).json({ message: "Upload failed", error: error.message });
  });

  blobStream.on("finish", async () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    res.json({ url: publicUrl, path: filePath });
  });

  blobStream.end(req.file.buffer);
});
