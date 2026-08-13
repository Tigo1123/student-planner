import sharp from "sharp";
import { prisma } from "../../config/database.js";
import { deleteAvatar, uploadAvatar } from "../../services/avatarStorage.js";
import { HttpError } from "../../utils/httpError.js";
import { findSafeUserById, updateSafeUser } from "../users/user.service.js";

const FORMATS = new Set(["jpeg", "png", "webp"]);

async function profileWithStorage(userId) {
  return prisma.user.findUnique({ where: { id: userId }, select: { profileImagePublicId: true, profileImageUrl: true } });
}

export async function getProfile(userId) {
  const user = await findSafeUserById(userId);
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Authentication is required.");
  return user;
}

export function updateProfile(userId, input) {
  return updateSafeUser(userId, { name: input.name });
}

export async function replaceProfileAvatar(userId, file) {
  if (!file) throw new HttpError(400, "IMAGE_REQUIRED", "Choose an image to upload.");
  let metadata;
  try { metadata = await sharp(file.buffer, { failOn: "warning" }).metadata(); }
  catch { throw new HttpError(415, "UNSUPPORTED_IMAGE", "The selected file is not a valid JPEG, PNG, or WebP image."); }
  if (!FORMATS.has(metadata.format)) throw new HttpError(415, "UNSUPPORTED_IMAGE", "Use a JPEG, PNG, or WebP image.");

  let normalized;
  try {
    normalized = await sharp(file.buffer, { failOn: "warning" }).rotate().resize(512, 512, { fit: "cover", position: "attention" }).webp({ quality: 84, effort: 4 }).toBuffer();
  } catch {
    throw new HttpError(422, "IMAGE_PROCESSING_FAILED", "We couldn't process this photo. Try another image.");
  }

  const old = await profileWithStorage(userId);
  const uploaded = await uploadAvatar(normalized, userId);
  let user;
  try {
    user = await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: uploaded.url, profileImagePublicId: uploaded.publicId },
      select: { id: true, name: true, email: true, profileImageUrl: true, createdAt: true, updatedAt: true },
    });
  } catch (error) {
    await deleteAvatar(uploaded.publicId).catch(() => undefined);
    throw error;
  }
  if (old?.profileImagePublicId) deleteAvatar(old.profileImagePublicId).catch(() => console.warn("Old avatar cleanup failed after replacement.", { userId }));
  return user;
}

export async function removeProfileAvatar(userId) {
  const old = await profileWithStorage(userId);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: null, profileImagePublicId: null },
    select: { id: true, name: true, email: true, profileImageUrl: true, createdAt: true, updatedAt: true },
  });
  if (old?.profileImagePublicId) deleteAvatar(old.profileImagePublicId).catch(() => console.warn("Avatar cleanup failed after removal.", { userId }));
  return user;
}
