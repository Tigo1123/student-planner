import { Link } from "react-router-dom";
const destinations = {
  "Stay organized": "/app/courses",
  "Never miss deadlines": "/app/deadlines",
  "Improve productivity": "/app",
  "Track academic progress": "/app/assignments",
  "Manage my weekly schedule": "/app/timetable",
};
export default function OnboardingPriorities({ profile }) {
  if (!profile || (!profile.program && !profile.semester && !profile.yearOfStudy && !profile.academicYear && !profile.goals?.length)) return null;
  return <section className="dashboard-section" aria-label="Your academic priorities"><h2>Your academic priorities</h2><p>{[profile.program, profile.yearOfStudy, profile.semester, profile.academicYear].filter(Boolean).join(" · ")}</p><div className="onboarding-actions">{profile.goals?.filter(goal => destinations[goal]).map(goal => <Link className="outline-button" key={goal} to={destinations[goal]} state={goal === "Improve productivity" ? { quickAdd: "task" } : undefined}>{goal}</Link>)}</div></section>;
}
