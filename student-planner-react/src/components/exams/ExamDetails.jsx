import CourseIcon from "../courses/CourseIcon.jsx";
import { formatExamDate, formatExamTimeRange, getExamTiming } from "../../utils/examDateUtils.js";

function ExamDetails({ exam, todayKey, onEdit, onDelete }) {
  const timing = getExamTiming(exam.examDate, todayKey);
  return <div className="exam-details"><section className="exam-details__course" style={{ "--course-color": exam.course?.color || "#174f5c" }}><CourseIcon icon={exam.course?.icon} /><div><p>{exam.course?.code}</p><strong>{exam.course?.name}</strong></div><span className={`exam-countdown exam-countdown--${timing.tone}`}>{timing.label}</span></section><section className="exam-details__identity"><h3>{exam.title}</h3><div><span>{formatExamDate(exam.examDate)}</span><span>{formatExamTimeRange(exam.startTime, exam.endTime)}</span><span>{exam.room || "Room not set"}</span></div></section><section className="exam-details__section"><h3>Topics</h3>{exam.topics.length ? <ul className="exam-details__topics">{exam.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul> : <p>No topics added.</p>}</section><section className="exam-details__section"><h3>Notes</h3><p>{exam.notes || "No notes added."}</p></section><p className="assignment-details__updated">Last updated {new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(exam.updatedAt))}</p><div className="course-details__actions"><button className="primary-button" type="button" onClick={onEdit}>Edit or reschedule</button><button className="danger-button" type="button" onClick={onDelete}>Delete exam</button></div></div>;
}
export default ExamDetails;
