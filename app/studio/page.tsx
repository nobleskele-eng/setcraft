import { redirect } from "next/navigation";
import SetCraftApp from "../../src/App";
import { getAppUser } from "../auth";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  return (
    <SetCraftApp
      userDisplayName={user.displayName}
      userEmail={user.email}
      signOutPath="/api/auth/logout"
    />
  );
}
