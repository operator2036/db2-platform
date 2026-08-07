import PageShell from "@/components/site/PageShell";
import SpeciesBrowser from "@/components/genome/SpeciesBrowser";

export default function ObinodisPage() {
  return (
    <PageShell>
      <SpeciesBrowser speciesId="obinodis" />
    </PageShell>
  );
}
