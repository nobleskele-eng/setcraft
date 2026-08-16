import type { Metadata } from "next";
import AccountRecovery from "../../src/components/AccountRecovery";

export const metadata: Metadata = { title: "Forgot Password" };
export default function ForgotPasswordPage() { return <AccountRecovery mode="forgot" />; }

