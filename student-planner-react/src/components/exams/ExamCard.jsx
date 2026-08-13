import CourseIcon from "../courses/CourseIcon.jsx";
import { formatExamDate, formatExamTimeRange, getExamTiming } from "../../utils/examDateUtils.js";

function ExamCard({ exam, todayKey, index, onView }) {
  const timing = getExamTiming(exam.examDate, todayKey);
  return <article className={`exam-card exam-card--${timing.tone}`} style={{ "--course-color": exam.course?.color || "#174f5c", "--exam-index": index }}><div className="exam-card__course"><CourseIcon icon={exam.course?.icon} /><span><strong>{exam.course?.code}</strong>{exam.course?.name}</span><b className={`exam-countdown exam-countdown--${timing.tone}`}>{timing.label}</b></div><div className="exam-card__body"><h2>{exam.title}</h2><p className="exam-card__date">{formatExamDate(exam.examDate)}</p><div className="exam-card__place"><span>◷ {formatExamTimeRange(exam.startTime, exam.endTime)}</span><span>{exam.room ? `⌖ ${exam.room}` : "Room not set"}</span></div>{exam.topics.length > 0 && <p className="exam-card__topics"><strong>Topics:</strong> {exam.topics.slice(0, 3).join(" • ")}{exam.topics.length > 3 ? ` +${exam.topics.length - 3}` : ""}</p>}</div><button className="exam-card__action" type="button" onClick={() => onView(exam)}>View exam <span aria-hidden="true">→</span></button></article>;
}
export default ExamCard;
