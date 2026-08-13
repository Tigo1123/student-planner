import { requireInput } from "../../utils/apiValidation.js";
import { getDeadlines } from "./deadlines.service.js";
import { deadlineQuerySchema } from "./deadlines.validation.js";

export async function getDeadlineCenter(request, response) {
  response.json(await getDeadlines(request.auth.userId, requireInput(deadlineQuerySchema, request.query)));
}
