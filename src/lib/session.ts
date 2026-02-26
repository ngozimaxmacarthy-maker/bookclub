import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  memberName?: string;
  isLoggedIn?: boolean;
  role?: "admin" | "member";
}

const FALLBACK_SECRET = "complex_password_at_least_32_characters_long_bookclub";

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const secret = process.env.SESSION_SECRET;
  const password = secret && secret.length >= 32 ? secret : FALLBACK_SECRET;
  return getIronSession<SessionData>(cookieStore, {
    password,
    cookieName: "bookclub-session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
    },
  });
}
