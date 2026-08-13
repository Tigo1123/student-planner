import { requireId, requireInput } from "../../utils/apiValidation.js";
import { createSchedule, deleteSchedule, getSchedule, listSchedules, updateSchedule } from "./schedule.service.js";
import { serializeSchedule } from "./schedule.serializers.js";
import { createScheduleSchema, scheduleQuerySchema, updateScheduleSchema } from "./schedule.validation.js";

export async function getSchedules(request, response) {
  const query = requireInput(scheduleQuerySchema, request.query);
  const schedules = await listSchedules(request.auth.userId, query);
  response.json({ schedules: schedules.map(serializeSchedule), pagination: { limit: query.limit, offset: query.offset } });
}
export async function getScheduleById(request, response) {
  response.json({ schedule: serializeSchedule(await getSchedule(request.auth.userId, requireId(request.params.id, "Class schedule"))) });
}
export async function postSchedule(request, response) {
  const schedule = await createSchedule(request.auth.userId, requireInput(createScheduleSchema, request.body));
  response.status(201).json({ schedule: serializeSchedule(schedule) });
}
export async function patchSchedule(request, response) {
  const schedule = await updateSchedule(request.auth.userId, requireId(request.params.id, "Class schedule"), requireInput(updateScheduleSchema, request.body));
  response.json({ schedule: serializeSchedule(schedule) });
}
export async function removeSchedule(request, response) {
  await deleteSchedule(request.auth.userId, requireId(request.params.id, "Class schedule"));
  response.status(204).end();
}
