import { ArrowLeft, Waves } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="sc-not-found">
      <div><span><Waves /></span><p>404 · Outside the lane lines</p><h1>This page is not part of the current LaneLab workspace.</h1><Link href="/"><ArrowLeft /> Return to LaneLab</Link></div>
    </main>
  );
}
