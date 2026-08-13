import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

const memoryObjects = new Map();

if (env.AVATAR_STORAGE_PROVIDER === "cloudinary") {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function uploadCloudinary(buffer, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: "image",
      folder: "student-planner/avatars",
      public_id: `${userId}-${crypto.randomUUID()}`,
      overwrite: false,
    }, (error, result) => {
      if (error) reject(error);
      else resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function uploadAvatar(buffer, userId) {
  if (env.AVATAR_STORAGE_PROVIDER === "cloudinary") return uploadCloudinary(buffer, userId);
  const publicId = `test-avatar-${userId}-${crypto.randomUUID()}`;
  memoryObjects.set(publicId, buffer);
  return { url: `https://avatar.test/${publicId}.webp`, publicId };
}

export async function deleteAvatar(publicId) {
  if (!publicId) return;
  if (env.AVATAR_STORAGE_PROVIDER === "cloudinary") {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    return;
  }
  memoryObjects.delete(publicId);
}
