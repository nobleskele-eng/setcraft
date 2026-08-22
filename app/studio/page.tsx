import { redirect } from "next/navigation";
import LaneLabApp from "../../src/App";
import { getAppUser } from "../auth";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  return (
    <LaneLabApp
      userDisplayName={user.displayName}
      userEmail={user.email}
      signOutPath="/api/auth/logout"
    />
  );
}
