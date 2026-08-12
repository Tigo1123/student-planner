import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

try {
  await prisma.$connect();
} catch (error) {
  console.error("Student Planner API could not connect to PostgreSQL.", {
    name: error?.name || "DatabaseConnectionError",
  });
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  console.log(`Student Planner API listening on port ${env.PORT}.`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
