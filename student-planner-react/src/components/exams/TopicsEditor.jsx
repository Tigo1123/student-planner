import { useState } from "react";

function TopicsEditor({ topics, onChange, error }) {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");
  function addTopic() {
    const value = draft.trim();
    if (!value) { setLocalError("Enter a topic first."); return; }
    if (value.length > 200) { setLocalError("Topics must be 200 characters or fewer."); return; }
    if (topics.length >= 50) { setLocalError("An exam can have at most 50 topics."); return; }
    if (topics.some((topic) => topic.toLowerCase() === value.toLowerCase())) { setLocalError("That topic is already included."); return; }
    onChange([...topics, value]); setDraft(""); setLocalError("");
  }
  return <div className="topics-editor"><label htmlFor="exam-topic-input">Topics</label><div className="topics-editor__input"><input id="exam-topic-input" value={draft} onChange={(e) => { setDraft(e.target.value); setLocalError(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }} maxLength="200" placeholder="Add a topic" aria-describedby="topics-hint topics-error" /><button type="button" onClick={addTopic}>Add</button></div><p className="form-hint" id="topics-hint">Press Enter or Add. Up to 50 topics.</p>{topics.length > 0 && <ul className="topic-chips" aria-label="Exam topics">{topics.map((topic, index) => <li key={`${topic}-${index}`}><span>{topic}</span><button type="button" onClick={() => onChange(topics.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${topic}`}>×</button></li>)}</ul>} {(localError || error) && <p className="form-error" id="topics-error" role="alert">{localError || error}</p>}</div>;
}
export default TopicsEditor;
