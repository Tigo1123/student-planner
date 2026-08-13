import { getCourseIcon } from "./courseOptions.js";

function CourseIcon({ icon, className = "" }) {
  const option = getCourseIcon(icon);
  return <span className={`course-icon ${className}`} aria-hidden="true">{option.symbol}</span>;
}
export default CourseIcon;
