import "server-only";
import { getActiveCompanyId } from "./active-company";

export async function getEffectiveCompanyId(user: any): Promise<string | null> {
  if (user?.role === "group_admin") {
    return await getActiveCompanyId();
  }
  return user?.companyId ?? null;
}