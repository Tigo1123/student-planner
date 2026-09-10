import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import PlannerPage from "./PlannerPage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import AssignmentsPage from "./pages/AssignmentsPage.jsx";
import ExamsPage from "./pages/ExamsPage.jsx";
import TimetablePage from "./pages/TimetablePage.jsx";
import DeadlinesPage from "./pages/DeadlinesPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute onboarding />}><Route path="/onboarding" element={<OnboardingPage />} /></Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<PlannerPage />} />
        <Route path="/app/courses" element={<CoursesPage />} />
        <Route path="/app/assignments" element={<AssignmentsPage />} />
        <Route path="/app/exams" element={<ExamsPage />} />
        <Route path="/app/timetable" element={<TimetablePage />} />
        <Route path="/app/deadlines" element={<DeadlinesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
