import SetCraftApp from "../src/App";
import AuthGate from "../src/components/AuthGate";
import {
  chatGPTSignOutPath,
  getChatGPTUser,
} from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  if (!user) {
    return <AuthGate />;
  }

  return (
    <SetCraftApp
      userDisplayName={user.displayName}
      userEmail={user.email}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
