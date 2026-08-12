import { HttpError } from "../../utils/httpError.js";
import {
  createEventSchema,
  createTaskSchema,
  importPlannerSchema,
  parsePlannerInput,
  updateEventSchema,
  updateTaskSchema,
} from "./planner.validation.js";
import {
  createEvent,
  createTask,
  deleteEvent,
  deleteTask,
  importLegacyPlanner,
  listEvents,
  listTasks,
  updateEvent,
  updateTask,
} from "./planner.service.js";
import { serializeEvent, serializeTask } from "./planner.serializers.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireInput(schema, body) {
  const result = parsePlannerInput(schema, body);
  if (result.validationError) {
    throw new HttpError(400, "VALIDATION_ERROR", "Please correct the planner data.", result.validationError);
  }
  return result;
}

function requireRecordId(value, recordName) {
  if (!UUID_PATTERN.test(value)) {
    throw new HttpError(404, "NOT_FOUND", `${recordName} was not found.`);
  }
  return value;
}

export async function getTasks(request, response) {
  const tasks = await listTasks(request.auth.userId);
  response.json({ tasks: tasks.map(serializeTask) });
}

export async function postTask(request, response) {
  const input = requireInput(createTaskSchema, request.body);
  const task = await createTask(request.auth.userId, input);
  response.status(201).json({ task: serializeTask(task) });
}

export async function patchTask(request, response) {
  const id = requireRecordId(request.params.id, "Task");
  const input = requireInput(updateTaskSchema, request.body);
  const task = await updateTask(request.auth.userId, id, input);
  response.json({ task: serializeTask(task) });
}

export async function removeTask(request, response) {
  const id = requireRecordId(request.params.id, "Task");
  await deleteTask(request.auth.userId, id);
  response.status(204).end();
}

export async function getEvents(request, response) {
  const events = await listEvents(request.auth.userId);
  response.json({ events: events.map(serializeEvent) });
}

export async function postEvent(request, response) {
  const input = requireInput(createEventSchema, request.body);
  const event = await createEvent(request.auth.userId, input);
  response.status(201).json({ event: serializeEvent(event) });
}

export async function patchEvent(request, response) {
  const id = requireRecordId(request.params.id, "Event");
  const input = requireInput(updateEventSchema, request.body);
  const event = await updateEvent(request.auth.userId, id, input);
  response.json({ event: serializeEvent(event) });
}

export async function removeEvent(request, response) {
  const id = requireRecordId(request.params.id, "Event");
  await deleteEvent(request.auth.userId, id);
  response.status(204).end();
}

export async function importPlanner(request, response) {
  const input = requireInput(importPlannerSchema, request.body);
  const result = await importLegacyPlanner(request.auth.userId, input);
  response.status(201).json({
    tasks: result.tasks.map(serializeTask),
    events: result.events.map(serializeEvent),
  });
}
