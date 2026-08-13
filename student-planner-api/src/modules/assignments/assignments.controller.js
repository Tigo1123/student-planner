import { requireId, requireInput } from "../../utils/apiValidation.js";
import { createAssignment, deleteAssignment, getAssignment, listAssignments, updateAssignment } from "./assignments.service.js";
import { serializeAssignment } from "./assignments.serializers.js";
import { assignmentQuerySchema, createAssignmentSchema, updateAssignmentSchema } from "./assignments.validation.js";

export async function getAssignments(request, response) {
  const query = requireInput(assignmentQuerySchema, request.query);
  const assignments = await listAssignments(request.auth.userId, query);
  response.json({ assignments: assignments.map(serializeAssignment), pagination: { limit: query.limit, offset: query.offset } });
}
export async function getAssignmentById(request, response) {
  response.json({ assignment: serializeAssignment(await getAssignment(request.auth.userId, requireId(request.params.id, "Assignment"))) });
}
export async function postAssignment(request, response) {
  const assignment = await createAssignment(request.auth.userId, requireInput(createAssignmentSchema, request.body));
  response.status(201).json({ assignment: serializeAssignment(assignment) });
}
export async function patchAssignment(request, response) {
  const assignment = await updateAssignment(request.auth.userId, requireId(request.params.id, "Assignment"), requireInput(updateAssignmentSchema, request.body));
  response.json({ assignment: serializeAssignment(assignment) });
}
export async function removeAssignment(request, response) {
  await deleteAssignment(request.auth.userId, requireId(request.params.id, "Assignment"));
  response.status(204).end();
}
