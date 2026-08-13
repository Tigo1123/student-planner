import { requireId, requireInput } from "../../utils/apiValidation.js";
import { createReminder, deleteReminder, enrichReminders, listReminders, updateReminder } from "./reminders.service.js";
import { serializeReminder } from "./reminders.serializers.js";
import { createReminderSchema, reminderQuerySchema, updateReminderSchema } from "./reminders.validation.js";

async function respondWithReminders(request, response, state) {
  const query = requireInput(reminderQuerySchema, { ...request.query, ...(state ? { state } : {}) });
  const reminders = await enrichReminders(request.auth.userId, await listReminders(request.auth.userId, query));
  response.json({ reminders: reminders.map(serializeReminder), pagination: { limit: query.limit, offset: query.offset } });
}
export function getReminders(request, response) { return respondWithReminders(request, response); }
export function getDueReminders(request, response) { return respondWithReminders(request, response, "due"); }
export async function postReminder(request, response) {
  const reminder = await createReminder(request.auth.userId, requireInput(createReminderSchema, request.body));
  response.status(201).json({ reminder: serializeReminder((await enrichReminders(request.auth.userId, [reminder]))[0]) });
}
export async function patchReminder(request, response) {
  const reminder = await updateReminder(request.auth.userId, requireId(request.params.id, "Reminder"), requireInput(updateReminderSchema, request.body));
  response.json({ reminder: serializeReminder((await enrichReminders(request.auth.userId, [reminder]))[0]) });
}
export async function removeReminder(request, response) {
  await deleteReminder(request.auth.userId, requireId(request.params.id, "Reminder"));
  response.status(204).end();
}
