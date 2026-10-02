import express, { type Express, type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { uploadImage, isCloudinaryConfigured } from "../services/cloudinary";

// Configure multer for memory storage (no disk writes)
const storage = multer.memoryStorage();

// File filter to only allow image types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
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

// Without Cloudinary credentials, images are saved here and served at /uploads/...
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export function registerUploadRoutes(app: Express) {
  // Locally stored images. File names are generated server-side, never taken from the client.
  app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

  // POST /api/uploads/image — upload an image to Cloudinary, or to UPLOAD_DIR when it isn't configured
  app.post("/api/uploads/image", requireAuth, (req: Request, res: Response) => {
    // Use multer middleware to handle single file upload
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

      try {
        // Generate a unique filename with user ID and timestamp
        const userId = req.dbUser?.id || "unknown";
        const timestamp = Date.now();
        const filename = `user_${userId}_${timestamp}`;

        if (!isCloudinaryConfigured()) {
          // Return a path, not a full URL, so saved photos survive a LAN IP change;
          // clients prefix it with the API base URL when displaying it.
          const format = EXT_BY_MIME[req.file.mimetype] ?? "jpg";
          const name = `${filename}.${format}`;
          await fs.mkdir(path.join(UPLOAD_DIR, "issues"), { recursive: true });
          await fs.writeFile(path.join(UPLOAD_DIR, "issues", name), req.file.buffer);
          res.status(201).json({
            success: true,
            data: {
              url: `/uploads/issues/${name}`,
              public_id: `issues/${name}`,
              format,
              width: null,
              height: null,
              bytes: req.file.size,
            },
          });
          return;
        }

        // Upload to Cloudinary
        const result = await uploadImage(
          req.file.buffer,
          "wardconnect/issues",
          filename,
        );

        // Return the uploaded image URL
        res.status(201).json({
          success: true,
          data: {
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          },
        });
      } catch (error) {
        console.error("[Upload] Image upload failed:", error);
        res.status(500).json({
          error: "Failed to upload image. Please try again.",
        });
      }
    });
  });
}