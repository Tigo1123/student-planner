import { lazy, Suspense, useEffect, useRef, useState } from "react";
import CourseDialog from "../courses/CourseDialog.jsx";
import UserAvatar from "./UserAvatar.jsx";
import { removeAvatar, updateProfile, uploadAvatar } from "../../api/profileApi.js";

const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const AvatarCropStep = lazy(() => import("./AvatarCropStep.jsx"));

function EditProfileDialog({ user, onUserChange, onClose }) {
  const [name, setName] = useState(user.name);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cropSource, setCropSource] = useState(null);
  const [originalName, setOriginalName] = useState("avatar");
  const [step, setStep] = useState("profile");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const inputRef = useRef(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => { if (cropSource) URL.revokeObjectURL(cropSource); }, [cropSource]);

  function chooseFile(event) {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!TYPES.has(next.type)) { setError("Use a JPEG, PNG, or WebP image."); event.target.value = ""; return; }
    if (next.size > MAX_BYTES) { setError("Image must be smaller than 5 MB."); event.target.value = ""; return; }
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(URL.createObjectURL(next)); setOriginalName(next.name); setStep("crop"); setError("");
  }

  function cancelSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (cropSource) URL.revokeObjectURL(cropSource);
    setPreviewUrl(null); setFile(null);
    setCropSource(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function cancelCrop() {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null); setStep("profile");
    if (inputRef.current) inputRef.current.value = "";
  }

  function acceptCrop(croppedFile) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(croppedFile); setPreviewUrl(URL.createObjectURL(croppedFile)); setStep("profile");
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
  return <CourseDialog sectionLabel="Student account" title={step === "crop" ? "Crop Photo" : "Edit Profile"} description={step === "crop" ? "Choose the exact composition that will appear in your circular avatar." : "Keep your name and profile photo current across Student Planner."} onClose={() => !busy && (step === "crop" ? cancelCrop() : onClose())}>
    {step === "crop" ? <Suspense fallback={<div className="crop-loading" role="status">Loading photo editor…</div>}><AvatarCropStep source={cropSource} originalName={originalName} onCancel={cancelCrop} onDone={acceptCrop} /></Suspense> :
    <form className="profile-form" onSubmit={save} noValidate>
      <div className="profile-photo-editor">
        {previewUrl ? <span className="user-avatar user-avatar--preview"><img src={previewUrl} alt="Selected profile preview" /></span> : <UserAvatar user={user} size="preview" />}
        <div><input ref={inputRef} className="sr-only" id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} disabled={busy} /><label className="outline-button" htmlFor="profile-photo">{user.profileImageUrl || file ? "Change Photo" : "Upload Photo"}</label>{file && <button className="ghost-button" type="button" onClick={() => setStep("crop")} disabled={busy}>Re-crop</button>}{file && <button className="ghost-button" type="button" onClick={cancelSelection} disabled={busy}>Cancel Photo</button>}{user.profileImageUrl && !file && <button className="profile-remove-photo" type="button" onClick={remove} disabled={busy}>Remove Photo</button>}<small>{file ? "Preview of the final square crop." : "JPEG, PNG, or WebP · maximum 5 MB"}</small></div>
      </div>
      <div className="profile-fields"><label htmlFor="profile-name">Full Name *</label><input id="profile-name" value={name} maxLength="120" onChange={(event) => { setName(event.target.value); setError(""); }} disabled={busy} autoFocus /><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={user.email} readOnly aria-describedby="profile-email-hint" /><small id="profile-email-hint">Email cannot be changed here.</small></div>
      {error && <p className="course-form__api-error" role="alert">{error}</p>}
      {status && <p className="profile-progress" role="status">{status}</p>}
      <div className="course-dialog__actions"><button className="outline-button" type="button" onClick={() => onClose()} disabled={busy}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? status : "Save Changes"}</button></div>
    </form>}
  </CourseDialog>;
}
export default EditProfileDialog;
