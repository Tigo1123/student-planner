import { useMemo, useState } from "react";
import CourseIcon from "./CourseIcon.jsx";
import { COURSE_COLORS, COURSE_ICONS } from "./courseOptions.js";

const EMPTY = { name: "", code: "", instructor: "", room: "", credits: "", semester: "", academicYear: "", color: COURSE_COLORS[0].value, icon: "book" };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Course name is required.";
  if (!values.code.trim()) errors.code = "Course code is required.";
  if (values.credits !== "" && (!Number.isInteger(Number(values.credits)) || Number(values.credits) < 0 || Number(values.credits) > 60)) errors.credits = "Credits must be a whole number from 0 to 60.";
  return errors;
}

function CourseForm({ course, onSubmit, onCancel, isSubmitting, apiError }) {
  const initial = useMemo(() => course ? {
    name: course.name, code: course.code, instructor: course.instructor || "", room: course.room || "",
    credits: course.credits ?? "", semester: course.semester || "", academicYear: course.academicYear || "",
    color: course.color, icon: course.icon,
  } : EMPTY, [course]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }
  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSubmit({
      ...values,
      name: values.name.trim(), code: values.code.trim().toUpperCase(),
      instructor: values.instructor.trim() || null, room: values.room.trim() || null,
      credits: values.credits === "" ? null : Number(values.credits), semester: values.semester.trim() || null,
      academicYear: values.academicYear.trim() || null,
    });
  }
  const field = (id, label, options = {}) => (
    <div className="course-field">
      <label htmlFor={id}>{label}{options.required && <span aria-hidden="true"> *</span>}</label>
      <input id={id} value={values[id]} onChange={(event) => setField(id, event.target.value)} aria-invalid={Boolean(errors[id])} aria-describedby={errors[id] ? `${id}-error` : undefined} {...options.input} />
      {errors[id] && <p className="form-error" id={`${id}-error`}>{errors[id]}</p>}
    </div>
  );
  return (
    <form className="course-form" onSubmit={submit} noValidate>
      <div className="course-form__grid">
        {field("name", "Course Name", { required: true, input: { autoFocus: true, maxLength: 120, placeholder: "Database Systems" } })}
        {field("code", "Course Code", { required: true, input: { maxLength: 40, placeholder: "CSC 304" } })}
        {field("instructor", "Instructor", { input: { maxLength: 120, placeholder: "Dr. Alex Morgan" } })}
        {field("room", "Room", { input: { maxLength: 80, placeholder: "B12" } })}
        {field("credits", "Credits", { input: { type: "number", min: 0, max: 60, step: 1, inputMode: "numeric", placeholder: "3" } })}
        {field("semester", "Semester", { input: { maxLength: 60, placeholder: "Semester 1" } })}
        <div className="course-field course-field--wide">{field("academicYear", "Academic Year", { input: { maxLength: 20, placeholder: "2026/2027" } })}</div>
      </div>
      <fieldset className="course-choice-group">
        <legend>Course color</legend>
        <div className="course-color-options">
          {COURSE_COLORS.map((option) => <label key={option.value} title={option.name}><input type="radio" name="course-color" value={option.value} checked={values.color === option.value} onChange={() => setField("color", option.value)} /><span style={{ background: option.value }} /><span className="sr-only">{option.name}</span></label>)}
        </div>
      </fieldset>
      <fieldset className="course-choice-group">
        <legend>Course icon</legend>
        <div className="course-icon-options">
          {COURSE_ICONS.map((option) => <label key={option.key}><input type="radio" name="course-icon" value={option.key} checked={values.icon === option.key} onChange={() => setField("icon", option.key)} /><CourseIcon icon={option.key} /><span>{option.label}</span></label>)}
        </div>
      </fieldset>
      {apiError && <p className="course-form__api-error" role="alert">{apiError}</p>}
      <div className="course-dialog__actions">
        <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : course ? "Save changes" : "Add course"}</button>
      </div>
    </form>
  );
}
export default CourseForm;
