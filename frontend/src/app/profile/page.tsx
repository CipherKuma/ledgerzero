import Image from "next/image";
import { Shell } from "@/components/Shell";
import { buildWorkerDirectory } from "@/lib/directory";
import { readLatestDemoFlow } from "@/lib/demo-flow/run";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const workers = await buildWorkerDirectory();
  const latestDemo = await readLatestDemoFlow();

  return (
    <Shell>
      <section className="border-b bg-background py-8">
        <div className="lz-container grid justify-items-center gap-5 text-center">
          <div className="relative aspect-[5/4] w-full max-w-[460px] overflow-hidden rounded-lg border bg-card">
            <Image
              src="/page-heroes/register.jpg"
              alt="Gateway artwork representing a connected wallet account"
              fill
              priority
              className="object-cover"
            />
          </div>
          <div className="grid gap-2">
            <div className="lz-kicker">Profile</div>
            <h1 className="font-display text-2xl uppercase md:text-3xl">Connected wallet profile</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              See the worker inventory, listings, jobs, earnings, and direct Galileo reads that belong to the
              wallet currently connected through Privy.
            </p>
          </div>
        </div>
      </section>
      <section className="lz-section">
        <div className="lz-container max-w-6xl">
          <ProfileClient workers={workers} latestDemo={latestDemo} />
        </div>
      </section>
    </Shell>
  );
}
