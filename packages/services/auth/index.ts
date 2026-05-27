import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { eq } from "@repo/database";
import { env } from "@repo/database/env";

const JWT_SECRET = env.JWT_SECRET;

class AuthService {
  public async register(fullName: string, email: string, password: string) {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({
        fullName,
        email,
        passwordHash,
      })
      .returning();

    if (!user) throw new Error("Failed to create user");

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    };
  }

  public async login(email: string, password: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    };
  }

  public async getMe(userId: string) {
    const [user] = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  public verifyToken(token: string): { userId: string } {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { userId: payload.userId };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  }
}

export default AuthService;
