import type { Express, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { uploadImage, isCloudinaryConfigured } from "../services/cloudinary";

const localUploadDirectory = resolve(process.cwd(), "uploads");
const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

// Configure multer for memory storage (no disk writes)
const storage = multer.memoryStorage();

// File filter to only allow image types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."));
  }
};

// Configure multer with 5MB limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export function registerUploadRoutes(app: Express) {
  // POST /api/uploads/image — upload to Cloudinary or local development storage
  app.post("/api/uploads/image", requireAuth, (req: Request, res: Response) => {
    upload.single("image")(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File too large. Maximum size is 5MB." });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }

      if (err) {
        // Custom error from file filter
        res.status(err.statusCode || 500).json({ error: err.message });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No image file provided." });
        return;
      }

      if (!isCloudinaryConfigured()) {
        if (process.env.NODE_ENV !== "development") {
          res.status(503).json({
            error: "Image upload service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
          });
          return;
        }

        try {
          await mkdir(localUploadDirectory, { recursive: true });
          const extension = imageExtensions[req.file.mimetype] || extname(req.file.originalname) || ".jpg";
          const filename = `${randomUUID()}${extension}`;
          await writeFile(join(localUploadDirectory, filename), req.file.buffer);
          // Store a host-independent path: the app rebuilds the full URL from
          // its own API base, so a photo stays reachable when the report is
          // opened from another device (phone vs laptop vs LAN address).
          const url = `/uploads/${filename}`;
          res.status(201).json({
            url,
            public_id: filename,
            format: extension.slice(1),
            bytes: req.file.size,
          });
        } catch (error) {
          console.error("[Upload] Local image save failed:", error);
          res.status(500).json({ error: "Failed to save image locally." });
        }
        return;
      }

      try {
        // Generate a unique filename with user ID and timestamp
        const userId = req.dbUser?.id || "unknown";
        const timestamp = Date.now();
        const filename = `user_${userId}_${timestamp}`;

        // Upload to Cloudinary
        const result = await uploadImage(
          req.file.buffer,
          "wardconnect/issues",
          filename,
        );

        // Return the uploaded image URL
        res.status(201).json({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      } catch (error) {
        console.error("[Upload] Cloudinary upload failed:", error);
        res.status(500).json({
          error: "Failed to upload image to Cloudinary. Please try again.",
        });
      }
    });
  });
}