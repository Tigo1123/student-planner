import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { AUTH_TOKEN_TTL_SECONDS } from "../../utils/cookies.js";
import { HttpError } from "../../utils/httpError.js";
import { createUser, findUserByEmail } from "../users/user.service.js";

const PASSWORD_HASH_ROUNDS = 12;

export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  try {
    return await createUser({ name, email, passwordHash });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "EMAIL_IN_USE", "An account with this email already exists.");
    }
    throw error;
  }
}

export async function authenticateUser({ email, password }) {
  const user = await findUserByEmail(email);
  const passwordIsValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, "$2b$12$0vN6n5Cw5IFGFLR.IbpgoeHApOPbkAAnHUPKuVqf7NxBTA1fKHxYq");

  if (!user || !passwordIsValid) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function createAuthToken(userId) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: AUTH_TOKEN_TTL_SECONDS,
    issuer: "student-planner-api",
    audience: "student-planner-web",
  });
}
