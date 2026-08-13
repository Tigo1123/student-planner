import { requireInput } from "../../utils/apiValidation.js";
import { getProfile, removeProfileAvatar, replaceProfileAvatar, updateProfile } from "./profile.service.js";
import { updateProfileSchema } from "./profile.validation.js";

export async function getCurrentProfile(request, response) { response.json({ user: await getProfile(request.auth.userId) }); }
export async function patchCurrentProfile(request, response) { response.json({ user: await updateProfile(request.auth.userId, requireInput(updateProfileSchema, request.body)) }); }
export async function postAvatar(request, response) { response.json({ user: await replaceProfileAvatar(request.auth.userId, request.file) }); }
export async function deleteCurrentAvatar(request, response) { response.json({ user: await removeProfileAvatar(request.auth.userId) }); }
