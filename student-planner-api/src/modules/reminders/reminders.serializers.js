export function serializeReminder(reminder) {
  const entity = reminder.entity;
  return {
    id: reminder.id,
    entityType: reminder.entityType,
    entityId: reminder.entityId,
    remindAt: reminder.remindAt,
    dismissed: reminder.dismissed,
    createdAt: reminder.createdAt,
    entity: entity ? {
      id: entity.id,
      title: entity.text ?? entity.title,
      date: entity.date?.toISOString().slice(0, 10) ?? entity.dueDate?.toISOString().slice(0, 10) ?? entity.examDate?.toISOString().slice(0, 10),
      ...(entity.startTime ? { startTime: entity.startTime } : {}),
      course: entity.course ? { id: entity.course.id, name: entity.course.name, code: entity.course.code, color: entity.course.color, icon: entity.course.icon } : null,
    } : null,
  };
}
