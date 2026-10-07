import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export interface UploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - The image buffer to upload
 * @param folder - Optional folder path in Cloudinary (e.g., "wardconnect/issues")
 * @param filename - Optional filename for the upload
 * @returns Promise with upload result containing secure_url and public_id
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string = "wardconnect",
  filename?: string,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const publicId = filename || `image_${timestamp}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        format: "jpg",
        transformation: [
          { width: 1200, height: 1200, crop: "limit" }, // Limit dimensions
          { quality: "auto:good" }, // Auto quality optimization
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        } else {
          reject(new Error("Upload failed: no result returned"));
        }
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id
 * @param publicId - The public_id of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteImage(publicId: string): Promise<{ result: string }> {
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Check if Cloudinary is configured
 * @returns true if Cloudinary credentials are available
 */
export function isCloudinaryConfigured(): boolean {
  return !!(cloudName && apiKey && apiSecret);
}

export default cloudinary;