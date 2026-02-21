import { getIronSession, IronSessionData } from "iron-session";
import { cookies } from "next/headers";

declare module "iron-session" {
  interface IronSessionData {
    memberName?: string;
    authenticated?: boolean;
  }
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "bookclub-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<IronSessionData>(cookieStore, sessionOptions);
}

export async function getMemberName(): Promise<string | null> {
  const session = await getSession();
  if (session.authenticated && session.memberName) {
    return session.memberName;
  }
  return null;
}
