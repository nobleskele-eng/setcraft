import { redirect } from "next/navigation";
import AccountForm from "../../src/components/AccountForm";
import { getAppUser } from "../auth";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (await getAppUser()) redirect("/studio");
  return <AccountForm mode="signup" />;
}
