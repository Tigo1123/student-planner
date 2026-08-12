import { useEffect, useRef, useState } from "react";
import { parseDateKey } from "../utils/dateUtils.js";

function useInlineEdit(record, onCommit) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(record.text);
  const [draftDate, setDraftDate] = useState(record.date);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const editFinishedRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  function startEditing() {
    setDraftText(record.text);
    setDraftDate(record.date);
    setError("");
    editFinishedRef.current = false;
    setIsEditing(true);
  }

  function cancelEditing() {
    editFinishedRef.current = true;
    setDraftText(record.text);
    setDraftDate(record.date);
    setError("");
    setIsEditing(false);
  }

  async function commitEditing() {
    if (editFinishedRef.current || savingRef.current) return;

    const trimmedText = draftText.trim();
    if (!trimmedText) {
      cancelEditing();
      return;
    }

    if (!parseDateKey(draftDate)) {
      setError("Choose a valid date before saving.");
      return;
    }

    savingRef.current = true;
    try {
      const wasSaved = await onCommit({ text: trimmedText, date: draftDate });
      if (wasSaved === false) {
        setError("The changes could not be saved. Check the date and try again.");
        return;
      }

      editFinishedRef.current = true;
      setError("");
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.message || "The changes could not be saved. Try again.");
    } finally {
      savingRef.current = false;
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitEditing();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  }

  function handleEditorBlur(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    void commitEditing();
  }

  return {
    isEditing,
    draftText,
    draftDate,
    error,
    inputRef,
    setDraftText,
    setDraftDate,
    startEditing,
    commitEditing,
    handleKeyDown,
    handleEditorBlur,
  };
}

export default useInlineEdit;
