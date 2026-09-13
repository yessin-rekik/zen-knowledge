import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "zen_active_company";

export async function getActiveCompanyId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function setActiveCompanyId(companyId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, companyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearActiveCompanyId() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}