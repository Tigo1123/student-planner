import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function createCroppedFile(source, area, originalName) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const outputSize = 1024;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outputSize, outputSize);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("The cropped photo could not be created.");
  const base = originalName.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${base}-cropped.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

function AvatarCropStep({ source, originalName, onCancel, onDone }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef(null);
  useLayoutEffect(() => { titleRef.current?.focus(); }, []);
  const complete = useCallback((_area, areaPixels) => setPixels(areaPixels), []);

  async function done() {
    if (!pixels || working) return;
    setWorking(true); setError("");
    try { await onDone(await createCroppedFile(source, pixels, originalName)); }
    catch { setError("The cropped photo could not be created. Please try again."); setWorking(false); }
  }

  return <section className="avatar-crop-step" aria-labelledby="avatar-crop-title">
    <header><p className="eyebrow">Profile photo</p><h3 ref={titleRef} tabIndex="-1" id="avatar-crop-title">Crop Photo</h3><p>Drag to reposition your photo, then adjust the zoom.</p></header>
    <div className="avatar-crop-workspace">
      <Cropper image={source} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={complete} objectFit="cover" />
    </div>
    <label className="avatar-crop-zoom" htmlFor="avatar-crop-zoom"><span>Zoom</span><input id="avatar-crop-zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
    {error && <p className="course-form__api-error" role="alert">{error}</p>}
    <div className="course-dialog__actions"><button className="outline-button" type="button" onClick={onCancel} disabled={working}>Cancel</button><button className="primary-button" type="button" onClick={done} disabled={working || !pixels}>{working ? "Preparing…" : "Done"}</button></div>
  </section>;
}

export default AvatarCropStep;
