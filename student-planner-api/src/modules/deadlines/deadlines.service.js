import { prisma } from "../../config/database.js";
import { parseDateKey, toDateKey } from "../../utils/date.js";

const typeOrder = { TASK: 0, ASSIGNMENT: 1, EVENT: 2, EXAM: 3 };

function addDays(date, amount) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}
function course(course) {
  return course ? { id: course.id, name: course.name, code: course.code, color: course.color } : null;
}
function normalize(record, type, date, completed, linkedCourse) {
  return { id: record.id, type, title: record.text ?? record.title, date: toDateKey(date), completed, ...(record.startTime ? { startTime: record.startTime } : {}), course: course(linkedCourse) };
}
function compare(a, b) {
  return a.date.localeCompare(b.date) || typeOrder[a.type] - typeOrder[b.type] || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
}

export async function getDeadlines(userId, query) {
  const today = query.today ? parseDateKey(query.today) : parseDateKey(new Date().toISOString().slice(0, 10));
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7 - today.getUTCDay());
  const completion = query.includeCompleted ? {} : { completed: false };
  const [tasks, events, assignments, exams] = await Promise.all([
    prisma.task.findMany({ where: { userId, ...completion }, include: { course: true }, orderBy: { date: "asc" }, take: query.limitPerType }),
    prisma.event.findMany({ where: { userId, ...completion }, include: { course: true }, orderBy: { date: "asc" }, take: query.limitPerType }),
    prisma.assignment.findMany({ where: { userId, ...completion }, include: { course: true }, orderBy: { dueDate: "asc" }, take: query.limitPerType }),
    prisma.exam.findMany({ where: { userId, examDate: { gte: today } }, include: { course: true }, orderBy: [{ examDate: "asc" }, { startTime: "asc" }], take: query.limitPerType }),
  ]);
  const records = [
    ...tasks.map((item) => normalize(item, "TASK", item.date, item.completed, item.course)),
    ...events.map((item) => normalize(item, "EVENT", item.date, item.completed, item.course)),
    ...assignments.map((item) => normalize(item, "ASSIGNMENT", item.dueDate, item.completed, item.course)),
    ...exams.map((item) => normalize(item, "EXAM", item.examDate, false, item.course)),
  ];
  const groups = { OVERDUE: [], TODAY: [], TOMORROW: [], THIS_WEEK: [], LATER: [] };
  for (const item of records) {
    const itemDate = parseDateKey(item.date);
    if (item.type !== "EXAM" && itemDate < today) groups.OVERDUE.push(item);
    else if (item.date === toDateKey(today)) groups.TODAY.push(item);
    else if (item.date === toDateKey(tomorrow)) groups.TOMORROW.push(item);
    else if (itemDate <= weekEnd) groups.THIS_WEEK.push(item);
    else groups.LATER.push(item);
  }
  for (const group of Object.values(groups)) group.sort(compare);
  return { asOf: toDateKey(today), groups };
}
