import PageShell from "@/components/site/PageShell";
import SpeciesBrowser from "@/components/genome/SpeciesBrowser";

export default function OsagittariusPage() {
  return (
    <PageShell>
      <SpeciesBrowser speciesId="osagittarius" />
    </PageShell>
  );
}
