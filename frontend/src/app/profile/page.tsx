import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/ledger-zero";
import { buildWorkerDirectory } from "@/lib/directory";
import { readLatestDemoFlow } from "@/lib/demo-flow/run";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const workers = await buildWorkerDirectory();
  const latestDemo = await readLatestDemoFlow();

  return (
    <Shell>
      <PageHeader
        kicker="Account"
        title="Connected wallet profile."
        image={{
          src: "/page-heroes/register.jpg",
          alt: "Gateway artwork representing a connected wallet account",
        }}
      >
        Wallet-scoped jobs, workers, listings, and earnings. Demo records remain labeled until live
        event indexing is deployed.
      </PageHeader>
      <section className="lz-section">
        <div className="lz-container">
          <ProfileClient workers={workers} latestDemo={latestDemo} />
        </div>
      </section>
    </Shell>
  );
}
