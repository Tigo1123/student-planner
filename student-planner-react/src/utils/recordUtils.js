export function toggleRecordCompletion(records, recordId) {
  return records.map((record) => (
    record.id === recordId
      ? { ...record, completed: !record.completed }
      : record
  ));
}

export function updateRecordDetails(records, recordId, updates) {
  return records.map((record) => (
    record.id === recordId ? { ...record, ...updates } : record
  ));
}

export function removeRecord(records, recordId) {
  return records.filter((record) => record.id !== recordId);
}
