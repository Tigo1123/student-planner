import { onboardingRouter } from "./modules/onboarding/onboarding.routes.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { plannerRouter } from "./modules/planner/planner.routes.js";
import { verifyRequestOrigin } from "./middleware/verifyRequestOrigin.js";
import { coursesRouter } from "./modules/courses/courses.routes.js";
import { assignmentsRouter } from "./modules/assignments/assignments.routes.js";
import { examsRouter } from "./modules/exams/exams.routes.js";
import { scheduleRouter } from "./modules/schedule/schedule.routes.js";
import { remindersRouter } from "./modules/reminders/reminders.routes.js";
import { deadlinesRouter } from "./modules/deadlines/deadlines.routes.js";
import { academicRouter } from "./modules/academic/academic.routes.js";
import { profileRouter } from "./modules/profile/profile.routes.js";

export const app = express();

app.disable("x-powered-by");
if (env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(verifyRequestOrigin);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use("/api/auth", authRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/users", profileRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/exams", examsRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/deadlines", deadlinesRouter);
app.use("/api/academic", academicRouter);
app.use("/api", plannerRouter);

app.use(notFound);
app.use(errorHandler);
