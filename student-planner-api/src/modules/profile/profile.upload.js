import multer from "multer";
import { HttpError } from "../../utils/httpError.js";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter(_request, file, callback) {
    callback(ACCEPTED_TYPES.has(file.mimetype) ? null : new HttpError(415, "UNSUPPORTED_IMAGE", "Use a JPEG, PNG, or WebP image."), ACCEPTED_TYPES.has(file.mimetype));
  },
}).single("avatar");

export function parseAvatar(request, response, next) {
  parser(request, response, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") return next(new HttpError(413, "IMAGE_TOO_LARGE", "Image must be smaller than 5 MB."));
    if (error.code === "LIMIT_UNEXPECTED_FILE") return next(new HttpError(400, "INVALID_UPLOAD", "Upload one image using the avatar field."));
    return next(error instanceof HttpError ? error : new HttpError(400, "INVALID_UPLOAD", "The image upload could not be read."));
  });
}
