import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/authContext.js";
import { apiRequest } from "../api/apiClient.js";
const request = (path, options = {}) => apiRequest(path, { ...options, signal: AbortSignal.timeout(30000) });
import ClassScheduleForm from "../components/timetable/ClassScheduleForm.jsx";
import { COURSE_COLORS } from "../components/courses/courseOptions.js";
import study from "../assets/illustrations/auth-study.svg";

const GOALS = ["Stay organized", "Never miss deadlines", "Improve productivity", "Track academic progress", "Manage my weekly schedule"];
const TITLES = ["Welcome to Student Planner", "Your academic workspace", "Make room for your classes", "What matters to you?", "Your Student Planner is ready."];
const EMPTY = { step: 0, semester: "", academicYear: "", program: "", yearOfStudy: "", courses: [], classes: [], goals: [] };
const EMPTY_COURSE = { name: "", code: "", instructor: "", color: COURSE_COLORS[0].value };

export default function OnboardingPage() {
  const { updateUser } = useAuth();
  const [draft, setDraft] = useState(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [course, setCourse] = useState(EMPTY_COURSE);
  const [addingClass, setAddingClass] = useState(false);
  const [expired, setExpired] = useState(false);
  const [conflict, setConflict] = useState(false);
  const lock = useRef(false);
  const heading = useRef(null);

  function showError(e) {
    setError([e.message, ...(e.details || []).map(d => d.message)].join(" "));
    if (e.code === "UNAUTHENTICATED") setExpired(true);
    if (e.code === "ONBOARDING_CONFLICT") setConflict(true);
  }
  useEffect(() => {
    let active = true;
    request("/api/onboarding").then(async state => {
      if (!active) return;
      if (state.onboardingCompleted) {
        const response = await request("/api/auth/me");
        if (active) updateUser(response.user);
      } else {
        setDraft({ ...EMPTY, ...state.onboardingDraft });
        setRevision(state.onboardingRevision);
      }
    }).catch(e => { if (active) showError(e); });
    return () => { active = false; };
    // Restore once per mounted authenticated onboarding session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { heading.current?.focus(); }, [draft?.step]);

  async function save(next, finish = false) {
    if (lock.current || expired || conflict) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const saved = await request("/api/onboarding", { method: "PATCH", body: JSON.stringify({ draft: next, revision }) });
      setRevision(saved.revision);
      setDraft(next);
      if (finish) {
        const result = await request("/api/onboarding/complete", { method: "POST", body: JSON.stringify({ revision: saved.revision }) });
        updateUser(result.user);
      }
      return true;
    } catch (e) { showError(e); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  const change = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  async function addCourse(e) {
    e.preventDefault();
    const code = course.code.trim().toUpperCase();
    if (draft.courses.some(c => c.code === code)) { setError("This course code is already in your setup."); return; }
    if (await save({ ...draft, courses: [...draft.courses, { ...course, name: course.name.trim(), code, id: crypto.randomUUID() }] })) setCourse(EMPTY_COURSE);
  }
  async function addClass(item) {
    if (await save({ ...draft, classes: [...draft.classes, item] })) setAddingClass(false);
  }
  const field = (key, label, maxLength) => <div className="course-field"><label htmlFor={`onboarding-${key}`}>{label}</label><input id={`onboarding-${key}`} value={draft[key]} maxLength={maxLength} onChange={e => change(key, e.target.value)} /></div>;
  const hasUnsavedCourse = Object.entries(course).some(([key, value]) => key !== "color" && value.trim());
  function move(step) {
    if (hasUnsavedCourse) { setError("Add your course or clear the course fields before continuing."); return; }
    save({ ...draft, step });
  }
  return <main className="onboarding-page"><aside className="onboarding-intro"><span className="auth-brand">Student Planner</span><p className="eyebrow eyebrow--light">A little planning. More possibility.</p><h2>Make space for what matters.</h2><p>Your courses, your schedule, your next chapter.</p><img src={study} alt="" /></aside><section className="onboarding-card" aria-busy={busy}>
    {error && <div role="alert" className="auth-error"><p>{error}</p>{expired ? <a href="/login">Sign in again</a> : <button type="button" className="outline-button" onClick={() => window.location.reload()}>Reload saved setup</button>}</div>}
    {!draft ? <p role="status">{error ? "Your setup could not be loaded." : "Loading your saved setup…"}</p> : <>
      <p className="eyebrow">Step {draft.step + 1} of 5 · About 3 minutes</p><progress aria-label="Onboarding progress" max="5" value={draft.step + 1} />
      <h1 ref={heading} tabIndex="-1">{TITLES[draft.step]}</h1>
      <fieldset className="onboarding-fields" disabled={busy || expired || conflict}>
      {draft.step === 0 && <><p>Manage your courses, tasks, assignments, exams, timetable, deadlines, and academic progress in one calm workspace.</p><p>Start with the essentials. You can add more and make changes later.</p><button className="primary-button" onClick={() => move(1)}>Get Started</button></>}
      {draft.step === 1 && <><p>Set your term and add the courses you want to plan for. All fields except course name and code are optional.</p><div className="course-form__grid">{field("semester", "Current semester or term", 60)}{field("academicYear", "Academic year", 20)}{field("program", "Program / major (optional)", 120)}{field("yearOfStudy", "Year of study (optional)", 30)}</div>
      <h2>Initial courses <small>({draft.courses.length}/20)</small></h2>
      {draft.courses.length === 0 && <p>No courses yet. Add your first course below, or continue to set up later.</p>}
      <ul className="onboarding-list">{draft.courses.map(c => <li key={c.id}><span><strong>{c.code}</strong> · {c.name}</span><button className="outline-button" aria-label={`Remove ${c.code}`} onClick={() => save({ ...draft, courses: draft.courses.filter(x => x.id !== c.id), classes: draft.classes.filter(x => x.courseId !== c.id) })}>Remove</button></li>)}</ul>
      <form onSubmit={addCourse} className="course-form"><div className="course-form__grid">{[["name", "Course name", 120], ["code", "Course code", 40], ["instructor", "Lecturer (optional)", 120]].map(([key, label, max]) => <div className="course-field" key={key}><label htmlFor={`course-${key}`}>{label}</label><input id={`course-${key}`} required={key !== "instructor"} maxLength={max} value={course[key]} onChange={e => setCourse({ ...course, [key]: e.target.value })} /></div>)}<div className="course-field"><label htmlFor="course-color">Course color</label><select id="course-color" value={course.color} onChange={e => setCourse({ ...course, color: e.target.value })}>{COURSE_COLORS.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}</select></div></div><div className="onboarding-actions"><button className="outline-button" disabled={draft.courses.length >= 20}>Add course</button>{hasUnsavedCourse && <button type="button" className="outline-button" onClick={() => setCourse(EMPTY_COURSE)}>Clear fields</button>}</div></form></>}
      {draft.step === 2 && <><p>Add a few weekly classes, or skip this step and build your timetable later.</p><ul className="onboarding-list">{draft.classes.map((c, i) => <li key={`${c.dayOfWeek}-${c.startTime}`}><span><strong>{draft.courses.find(x => x.id === c.courseId)?.code}</strong> · {c.dayOfWeek.toLowerCase()} {c.startTime}–{c.endTime}{c.room && ` · ${c.room}`}</span><button className="outline-button" aria-label={`Remove class ${i + 1}`} onClick={() => save({ ...draft, classes: draft.classes.filter((_, j) => i !== j) })}>Remove</button></li>)}</ul>{!draft.classes.length && <p>No classes scheduled yet.</p>}{!draft.courses.length ? <p>Add courses in the previous step to start your timetable.</p> : addingClass ? <ClassScheduleForm courses={draft.courses} onSubmit={addClass} onCancel={() => setAddingClass(false)} submitting={busy} /> : <button className="outline-button" disabled={draft.classes.length >= 60} onClick={() => setAddingClass(true)}>Add another class</button>}</>}
      {draft.step === 3 && <><p>Choose your priorities. We’ll keep helpful shortcuts on your dashboard.</p><div className="onboarding-goals">{GOALS.map(goal => <label key={goal}><input type="checkbox" checked={draft.goals.includes(goal)} onChange={e => change("goals", e.target.checked ? [...draft.goals, goal] : draft.goals.filter(g => g !== goal))} /><span>{goal}</span></label>)}</div></>}
      {draft.step === 4 && <><p>A clear start for your next chapter. Your workspace will be created when you continue to the dashboard.</p><div className="onboarding-summary"><strong>{draft.courses.length} courses added</strong><strong>{draft.classes.length} classes scheduled</strong></div>{draft.semester && <p>{draft.semester} · {draft.academicYear}</p>}{draft.goals.length > 0 && <ul>{draft.goals.map(g => <li key={g}>{g}</li>)}</ul>}<p>You can manage your courses and timetable any time.</p></>}
      {draft.step > 0 && <div className="onboarding-actions"><button className="outline-button" onClick={() => { setAddingClass(false); move(draft.step - 1); }}>Back</button>{draft.step < 4 ? <button className="primary-button" disabled={addingClass} onClick={() => move(draft.step + 1)}>Next</button> : <button className="primary-button" onClick={() => save(draft, true)}>Go to Dashboard</button>}{draft.step === 2 && <button className="outline-button" onClick={() => { setAddingClass(false); move(3); }}>Skip for now</button>}{draft.step === 3 && <button className="outline-button" onClick={() => save({ ...draft, goals: [], step: 4 })}>Skip for now</button>}</div>}
      </fieldset><p className="onboarding-save" role="status">{busy ? "Saving your setup… This may take a moment." : "Added courses, added classes, and each step are saved securely. Finish typing and continue to save other changes."}</p>
    </>}
  </section></main>;
}
