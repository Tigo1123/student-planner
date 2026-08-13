import { prisma } from "../../config/database.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
};

export function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export function findSafeUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });
}

export function createUser({ name, email, passwordHash }) {
  return prisma.user.create({
    data: { name, email, passwordHash },
    select: safeUserSelect,
  });
}

export function updateSafeUser(id, data) {
  return prisma.user.update({ where: { id }, data, select: safeUserSelect });
}
