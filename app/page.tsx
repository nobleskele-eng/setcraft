import LandingPage from "../src/components/LandingPage";
import { getAppUser } from "./auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAppUser();
  return <LandingPage user={user} />;
}
