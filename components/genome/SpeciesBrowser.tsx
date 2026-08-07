"use client";

import Link from "next/link";
import JBrowseWrapper from "@/components/genome/JBrowseWrapper";
import { SPECIES_LIST, SPECIES_CONFIGS } from "@/lib/jbrowse-config";

export default function SpeciesBrowser({ speciesId }: { speciesId: string }) {
  const species = SPECIES_LIST.find((s) => s.id === speciesId)!;
  const config = SPECIES_CONFIGS[speciesId];

  return (
    <>
      <div
        style={{
          background: "#0c1028",
          borderBottom: "1px solid rgba(99,102,241,0.15)",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "#475569",
          }}
        >
          Species:
        </span>
        {SPECIES_LIST.map((s) => {
          const active = s.id === speciesId;
          return (
            <Link
              key={s.id}
              href={`/genome-browser/${s.id}`}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: active ? "none" : "1px solid rgba(99,102,241,0.2)",
                background: active ? "#6366f1" : "rgba(99,102,241,0.08)",
                color: active ? "#ffffff" : "#94a3b8",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontStyle: "italic",
                textDecoration: "none",
                lineHeight: 1.4,
              }}
            >
              {s.scientificName}
            </Link>
          );
        })}
        <span style={{ color: "#475569" }}> · </span>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontStyle: "italic",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          {species.scientificName}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#64748b" }}>
          {species.assemblyName}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#64748b" }}>
          {species.genomeSize}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: "calc(100vh - 130px)",
          overflow: "visible",
          position: "relative",
        }}
      >
        <JBrowseWrapper
          key={speciesId}
          assembly={config.assembly}
          tracks={config.tracks}
          speciesKey={speciesId}
        />
      </div>
    </>
  );
}
