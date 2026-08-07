import PageShell from "@/components/site/PageShell";
import SpeciesBrowser from "@/components/genome/SpeciesBrowser";

export default function OtaurusPage() {
  return (
    <PageShell>
      <SpeciesBrowser speciesId="otaurus" />
    </PageShell>
  );
}
