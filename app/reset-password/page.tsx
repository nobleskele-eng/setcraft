import type { Metadata } from "next";
import AccountRecovery from "../../src/components/AccountRecovery";

export const metadata: Metadata = { title: "Reset Password" };
export default function ResetPasswordPage() { return <AccountRecovery mode="reset" />; }

