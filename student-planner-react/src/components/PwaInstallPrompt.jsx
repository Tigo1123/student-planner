import { useEffect, useState } from "react";

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  }

  if (!installEvent || isInstalled) return null;

  return (
    <aside className="pwa-install-prompt" aria-label="Install Student Planner">
      <span>Keep your planner close. Install the app on your device.</span>
      <button type="button" onClick={installApp}>Install</button>
      <button
        className="pwa-install-dismiss"
        type="button"
        aria-label="Dismiss install prompt"
        onClick={() => setInstallEvent(null)}
      >
        ×
      </button>
    </aside>
  );
}

export default PwaInstallPrompt;
