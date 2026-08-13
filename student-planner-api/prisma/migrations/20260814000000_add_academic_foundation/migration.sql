CREATE TYPE "AssignmentPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "AssignmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE "ReminderEntityType" AS ENUM ('TASK', 'EVENT', 'ASSIGNMENT', 'EXAM');

CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "instructor" TEXT,
    "room" TEXT,
    "credits" INTEGER,
    "semester" TEXT,
    "academicYear" TEXT,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "icon" TEXT NOT NULL DEFAULT 'book',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATE NOT NULL,
    "priority" "AssignmentPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AssignmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "examDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "room" TEXT,
    "topics" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "class_schedules" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "entityType" "ReminderEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "remindAt" TIMESTAMPTZ(3) NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tasks" ADD COLUMN "courseId" UUID;
ALTER TABLE "events" ADD COLUMN "courseId" UUID;

CREATE INDEX "courses_userId_idx" ON "courses"("userId");
CREATE INDEX "courses_userId_archivedAt_idx" ON "courses"("userId", "archivedAt");
CREATE INDEX "courses_userId_code_idx" ON "courses"("userId", "code");
CREATE INDEX "assignments_userId_idx" ON "assignments"("userId");
CREATE INDEX "assignments_userId_dueDate_idx" ON "assignments"("userId", "dueDate");
CREATE INDEX "assignments_userId_status_dueDate_idx" ON "assignments"("userId", "status", "dueDate");
CREATE INDEX "assignments_courseId_dueDate_idx" ON "assignments"("courseId", "dueDate");
CREATE INDEX "exams_userId_idx" ON "exams"("userId");
CREATE INDEX "exams_userId_examDate_idx" ON "exams"("userId", "examDate");
CREATE INDEX "exams_courseId_examDate_idx" ON "exams"("courseId", "examDate");
CREATE INDEX "class_schedules_userId_idx" ON "class_schedules"("userId");
CREATE INDEX "class_schedules_userId_dayOfWeek_startTime_idx" ON "class_schedules"("userId", "dayOfWeek", "startTime");
CREATE INDEX "class_schedules_courseId_idx" ON "class_schedules"("courseId");
CREATE INDEX "reminders_userId_idx" ON "reminders"("userId");
CREATE INDEX "reminders_userId_dismissed_remindAt_idx" ON "reminders"("userId", "dismissed", "remindAt");
CREATE INDEX "reminders_entityType_entityId_idx" ON "reminders"("entityType", "entityId");
CREATE INDEX "tasks_courseId_idx" ON "tasks"("courseId");
CREATE INDEX "events_courseId_idx" ON "events"("courseId");

ALTER TABLE "courses" ADD CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exams" ADD CONSTRAINT "exams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exams" ADD CONSTRAINT "exams_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
