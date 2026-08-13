import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ReminderProvider } from "./reminders/ReminderProvider.jsx";
import "./styles/style.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ReminderProvider><App /></ReminderProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
