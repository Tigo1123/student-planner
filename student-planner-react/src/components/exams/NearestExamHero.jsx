import CourseIcon from "../courses/CourseIcon.jsx";
import { formatExamDate, formatExamTimeRange, getExamTiming } from "../../utils/examDateUtils.js";

function NearestExamHero({ exam, todayKey, onView }) {
  if (!exam) return null; const timing = getExamTiming(exam.examDate, todayKey);
  return <section className={`nearest-exam nearest-exam--${timing.tone}`} style={{ "--course-color": exam.course?.color || "#174f5c" }} aria-labelledby="nearest-exam-title"><div className="nearest-exam__heading"><p className="eyebrow">Next on your calendar</p><span className={`exam-countdown exam-countdown--${timing.tone}`}>{timing.label}</span></div><div className="nearest-exam__main"><CourseIcon icon={exam.course?.icon} /><div><p>{exam.course?.code} · {exam.course?.name}</p><h2 id="nearest-exam-title">{exam.title}</h2></div></div><div className="nearest-exam__facts"><span><strong>{formatExamDate(exam.examDate)}</strong>Date</span><span><strong>{formatExamTimeRange(exam.startTime, exam.endTime)}</strong>Time</span><span><strong>{exam.room || "Not set"}</strong>Room</span></div>{exam.topics.length > 0 && <div className="nearest-exam__topics"><strong>Prepare:</strong>{exam.topics.slice(0, 4).map((topic) => <span key={topic}>{topic}</span>)}</div>}<button type="button" onClick={() => onView(exam)}>Open exam details <span aria-hidden="true">→</span></button></section>;
}
export default NearestExamHero;
