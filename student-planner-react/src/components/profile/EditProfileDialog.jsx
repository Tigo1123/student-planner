import { useEffect, useRef, useState } from "react";
import CourseDialog from "../courses/CourseDialog.jsx";
import UserAvatar from "./UserAvatar.jsx";
import { removeAvatar, updateProfile, uploadAvatar } from "../../api/profileApi.js";

const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function EditProfileDialog({ user, onUserChange, onClose }) {
  const [name, setName] = useState(user.name);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const inputRef = useRef(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function chooseFile(event) {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!TYPES.has(next.type)) { setError("Use a JPEG, PNG, or WebP image."); event.target.value = ""; return; }
    if (next.size > MAX_BYTES) { setError("Image must be smaller than 5 MB."); event.target.value = ""; return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(next)); setFile(next); setError("");
  }

  function cancelSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function save(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Name is required."); return; }
    if (trimmed.length > 120) { setError("Name must be 120 characters or fewer."); return; }
    setError("");
    try {
      let nextUser = user;
      if (trimmed !== user.name) { setStatus("Saving profile…"); nextUser = (await updateProfile(trimmed)).user; onUserChange(nextUser); }
      if (file) { setStatus("Uploading photo…"); nextUser = (await uploadAvatar(file)).user; onUserChange(nextUser); }
      setStatus(""); onClose(`${nextUser.name}'s profile was updated.`);
    } catch (nextError) { setStatus(""); setError(nextError.message || "We couldn't update your profile. Please try again."); }
  }

  async function remove() {
    setStatus("Removing photo…"); setError("");
    try { const response = await removeAvatar(); onUserChange(response.user); cancelSelection(); setStatus(""); }
    catch (nextError) { setStatus(""); setError(nextError.message || "We couldn't remove your photo. Please try again."); }
  }

  const busy = Boolean(status);
  return <CourseDialog sectionLabel="Student account" title="Edit Profile" description="Keep your name and profile photo current across Student Planner." onClose={() => !busy && onClose()}>
    <form className="profile-form" onSubmit={save} noValidate>
      <div className="profile-photo-editor">
        {previewUrl ? <span className="user-avatar user-avatar--preview"><img src={previewUrl} alt="Selected profile preview" /></span> : <UserAvatar user={user} size="preview" />}
        <div><input ref={inputRef} className="sr-only" id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} disabled={busy} /><label className="outline-button" htmlFor="profile-photo">{user.profileImageUrl ? "Change Photo" : "Upload Photo"}</label>{file && <button className="ghost-button" type="button" onClick={cancelSelection} disabled={busy}>Cancel selection</button>}{user.profileImageUrl && !file && <button className="profile-remove-photo" type="button" onClick={remove} disabled={busy}>Remove Photo</button>}<small>JPEG, PNG, or WebP · maximum 5 MB</small></div>
      </div>
      <div className="profile-fields"><label htmlFor="profile-name">Full Name *</label><input id="profile-name" value={name} maxLength="120" onChange={(event) => { setName(event.target.value); setError(""); }} disabled={busy} autoFocus /><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={user.email} readOnly aria-describedby="profile-email-hint" /><small id="profile-email-hint">Email cannot be changed here.</small></div>
      {error && <p className="course-form__api-error" role="alert">{error}</p>}
      {status && <p className="profile-progress" role="status">{status}</p>}
      <div className="course-dialog__actions"><button className="outline-button" type="button" onClick={() => onClose()} disabled={busy}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? status : "Save Changes"}</button></div>
    </form>
  </CourseDialog>;
}
export default EditProfileDialog;
