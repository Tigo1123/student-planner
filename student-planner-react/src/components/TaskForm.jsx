import { useRef, useState } from "react";

const PRESET_CATEGORY_COLORS = {
  Homework: "#4f46e5",
  Exam: "#ef4444",
  Personal: "#10b981",
  Class: "#f59e0b",
};

const DEFAULT_CUSTOM_COLOR = "#64748b";
const VALID_HEX_COLOR = /^#[0-9a-f]{6}$/i;

function TaskForm({ selectedDate, onAddTask }) {
  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("Homework");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customColor, setCustomColor] = useState(DEFAULT_CUSTOM_COLOR);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const taskInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedText = taskText.trim();

    if (!selectedDate) {
      setError("Select a calendar date before adding a task.");
      return;
    }

    if (!trimmedText) {
      setError("Enter a task before adding it.");
      return;
    }

    const isCustomCategory = category === "Other";
    const resolvedCategory = isCustomCategory
      ? customCategoryName.trim() || "Other"
      : category;
    const resolvedColor = isCustomCategory && VALID_HEX_COLOR.test(customColor)
      ? customColor
      : PRESET_CATEGORY_COLORS[category] || DEFAULT_CUSTOM_COLOR;

    setIsSubmitting(true);
    try {
      const wasAdded = await onAddTask({
        text: trimmedText,
        category: resolvedCategory,
        color: resolvedColor,
      });

      if (!wasAdded) {
        setError("Select a calendar date before adding a task.");
        return;
      }

      setTaskText("");
      setCustomCategoryName("");
      setError("");
      taskInputRef.current?.focus();
    } catch (requestError) {
      setError(requestError.message || "The task could not be added. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleError = selectedDate && error.startsWith("Select a calendar") ? "" : error;

  return (
    <form className="planner-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="task-text">New task</label>
      <input
        id="task-text"
        ref={taskInputRef}
        type="text"
        value={taskText}
        placeholder="What needs to be done?"
        aria-describedby={visibleError ? "task-form-error" : undefined}
        aria-invalid={Boolean(visibleError)}
        onChange={(event) => {
          setTaskText(event.target.value);
          if (error) setError("");
        }}
      />
      <div className="form-row">
        <div className="field-group">
          <label htmlFor="task-category">Category</label>
          <select
            id="task-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="Homework">Homework</option>
            <option value="Exam">Exam</option>
            <option value="Personal">Personal</option>
            <option value="Class">Class</option>
            <option value="Other">Other (custom)</option>
          </select>
        </div>
        <button className="primary-button" type="submit" disabled={!selectedDate || isSubmitting}>
          {isSubmitting ? "Adding…" : "Add task"}
        </button>
      </div>

      {category === "Other" && (
        <div className="custom-category-fields">
          <div className="field-group">
            <label htmlFor="custom-category-name">Custom category</label>
            <input
              id="custom-category-name"
              type="text"
              value={customCategoryName}
              placeholder="Category name"
              onChange={(event) => setCustomCategoryName(event.target.value)}
            />
          </div>
          <div className="field-group color-field">
            <label htmlFor="custom-category-color">Color</label>
            <input
              id="custom-category-color"
              type="color"
              value={customColor}
              onChange={(event) => setCustomColor(event.target.value)}
            />
          </div>
        </div>
      )}

      {!selectedDate && !visibleError && (
        <p className="form-hint">Select a date to add tasks.</p>
      )}
      {visibleError && (
        <p className="form-error" id="task-form-error" role="alert">{visibleError}</p>
      )}
    </form>
  );
}

export default TaskForm;
