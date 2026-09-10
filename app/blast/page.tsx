"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "@/components/site/PageShell";

type Program = "blastn" | "blastp" | "blastx" | "tblastn";
type Phase = "input" | "submitted" | "polling" | "results" | "error";

type Hsp = {
  score: number;
  evalue: number;
  identity: number;
  align_len: number;
  qseq: string;
  hseq: string;
  midline: string;
  query_from: number;
  query_to: number;
  hit_from: number;
  hit_to: number;
};

type Hit = {
  description: { title: string; accession: string; sciname?: string }[];
  hsps: Hsp[];
};

const PROGRAMS: {
  value: Program;
  label: string;
  sub: string;
  description: string;
}[] = [
  {
    value: "blastn",
    label: "BLASTN",
    sub: "DNA→DNA",
    description: "Search nucleotide databases with a nucleotide query",
  },
  {
    value: "blastp",
    label: "BLASTP",
    sub: "Protein→Protein",
    description: "Search protein databases with a protein query",
  },
  {
    value: "blastx",
    label: "BLASTX",
    sub: "DNA→Protein",
    description:
      "Search protein databases using a translated nucleotide query",
  },
  {
    value: "tblastn",
    label: "TBLASTN",
    sub: "Protein→DNA",
    description: "Search translated nucleotide databases with a protein query",
  },
];

const ENTREZ_OPTIONS = [
  { label: "O. taurus genome", value: "txid166361[Organism]" },
  { label: "All Scarabaeinae", value: "txid92840[Organism]" },
  { label: "All insects", value: "txid50557[Organism]" },
  { label: "All NCBI", value: "" },
];

const EXAMPLE_SEQUENCE = `>Otau_doublesex_example
ATGCAGCAGCAACAACAGCAGCAGCAGCAGCAGCAGCAGCAACAGCAGCAGCAGCAGCAG
CAGCAGCCGCAGCAGCAGCAGCCTCAGCAGCAGCAACAGCAGCAGCAGCAGCAGCAGCAG`;

function databaseForProgram(program: Program): "nt" | "nr" {
  return program === "blastp" || program === "tblastn" ? "nr" : "nt";
}

const cardStyle: React.CSSProperties = {
  background: "#0c1028",
  border: "1px solid rgba(99,102,241,0.15)",
  borderRadius: "12px",
  padding: "20px",
};

const inputStyle: React.CSSProperties = {
  background: "#06081a",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: "8px",
  padding: "9px 12px",
  color: "#f1f5f9",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  outline: "none",
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#6366f1" : "rgba(99,102,241,0.08)",
    color: active ? "#ffffff" : "#94a3b8",
    border: `1px solid ${active ? "#6366f1" : "rgba(99,102,241,0.2)"}`,
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

type AlignBlock = {
  qStart: number;
  qEnd: number;
  qLine: string;
  mLine: string;
  hStart: number;
  hEnd: number;
  hLine: string;
};

function buildAlignmentBlocks(
  qseq: string,
  hseq: string,
  midline: string,
  qFrom: number,
  qTo: number,
  hFrom: number,
  hTo: number
): AlignBlock[] {
  const CHUNK = 60;
  const blocks: AlignBlock[] = [];
  const qDir = qTo >= qFrom ? 1 : -1;
  const hDir = hTo >= hFrom ? 1 : -1;
  let qPos = qFrom;
  let hPos = hFrom;

  for (let i = 0; i < qseq.length; i += CHUNK) {
    const qLine = qseq.slice(i, i + CHUNK);
    const hLine = hseq.slice(i, i + CHUNK);
    const mLine = midline.slice(i, i + CHUNK);
    const qNonGap = qLine.split("").filter((c) => c !== "-").length;
    const hNonGap = hLine.split("").filter((c) => c !== "-").length;
    const qStart = qPos;
    const hStart = hPos;
    const qEnd = qNonGap > 0 ? qPos + qDir * (qNonGap - 1) : qPos;
    const hEnd = hNonGap > 0 ? hPos + hDir * (hNonGap - 1) : hPos;
    blocks.push({ qStart, qEnd, qLine, mLine, hStart, hEnd, hLine });
    qPos = qEnd + (qNonGap > 0 ? qDir : 0);
    hPos = hEnd + (hNonGap > 0 ? hDir : 0);
  }
  return blocks;
}

function SeqLine({ line, midline }: { line: string; midline: string }) {
  return (
    <>
      {line.split("").map((ch, i) => {
        let color = "#ef4444";
        if (ch === "-") color = "#f59e0b";
        else if (midline[i] === "|") color = "#10b981";
        return (
          <span key={i} style={{ color }}>
            {ch}
          </span>
        );
      })}
    </>
  );
}

export default function BlastPage() {
  const [sequence, setSequence] = useState("");
  const [program, setProgram] = useState<Program>("blastn");
  const [entrezQuery, setEntrezQuery] = useState(ENTREZ_OPTIONS[0].value);
  const [evalue, setEvalue] = useState("0.001");
  const [hitlistSize, setHitlistSize] = useState(50);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [phase, setPhase] = useState<Phase>("input");
  const [rid, setRid] = useState<string | null>(null);
  const [estimatedSeconds, setEstimatedSeconds] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedHit, setExpandedHit] = useState<number | null>(null);

  const ridRef = useRef<string | null>(null);
  const database = useMemo(() => databaseForProgram(program), [program]);

  useEffect(() => {
    ridRef.current = rid;
  }, [rid]);

  useEffect(() => {
    if (phase !== "polling" || !rid) return;

    let stopped = false;
    const interval = setInterval(async () => {
      setElapsedSeconds((s) => s + 5);
      try {
        const statusRes = await fetch(`/api/blast/status?rid=${ridRef.current}`);
        const statusData = await statusRes.json();
        if (stopped) return;

        if (statusData.status === "READY") {
          stopped = true;
          clearInterval(interval);
          const resultsRes = await fetch(`/api/blast/results?rid=${ridRef.current}`);
          const resultsData = await resultsRes.json();
          setResults(resultsData);
          setPhase("results");
        } else if (statusData.status === "FAILED" || statusData.status === "UNKNOWN") {
          stopped = true;
          clearInterval(interval);
          setErrorMessage(
            "NCBI BLAST returned an error. This may be due to server load or an invalid sequence."
          );
          setPhase("error");
        }
      } catch {
        if (!stopped) {
          stopped = true;
          clearInterval(interval);
          setErrorMessage("Lost connection while polling NCBI for results.");
          setPhase("error");
        }
      }
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [phase, rid]);

  function resetToInput() {
    setPhase("input");
    setRid(null);
    setResults(null);
    setErrorMessage("");
    setElapsedSeconds(0);
    setExpandedHit(null);
  }

  async function handleSubmit() {
    setPhase("submitted");
    setErrorMessage("");
    try {
      const res = await fetch("/api/blast/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence,
          program,
          database,
          entrezQuery,
          evalue: Number(evalue) || 0.001,
          hitlistSize,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to submit BLAST job.");
        setPhase("error");
        return;
      }
      setRid(data.rid);
      setEstimatedSeconds(data.estimatedSeconds || 60);
      setElapsedSeconds(0);
      setPhase("polling");
    } catch {
      setErrorMessage("Could not reach the BLAST submission endpoint.");
      setPhase("error");
    }
  }

  const activeProgram = PROGRAMS.find((p) => p.value === program)!;
  const hits: Hit[] =
    results?.BlastOutput2?.[0]?.report?.results?.search?.hits || [];
  const queryLength =
    results?.BlastOutput2?.[0]?.report?.results?.search?.query_len ??
    sequence.replace(/^>.*$/m, "").replace(/\s/g, "").length;

  return (
    <PageShell>
      <style>{`
        @keyframes blastPulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{ background: "#06081a", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#6366f1",
                margin: 0,
              }}
            >
              DB² · SEQUENCE SEARCH
            </p>
            <h1
              style={{
                fontFamily: "Syne, var(--font-sans)",
                fontSize: "28px",
                fontWeight: 800,
                color: "#f1f5f9",
                margin: "6px 0 0",
              }}
            >
              BLAST Search
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: "#94a3b8",
                maxWidth: "600px",
                marginTop: "8px",
              }}
            >
              Search nucleotide or protein sequences against the Onthophagus
              taurus genome and related Scarabaeinae using NCBI BLAST. Results
              are retrieved from NCBI servers and typically take 1–5 minutes.
            </p>
          </div>

          {phase === "input" && (
            <InputPhase
              sequence={sequence}
              setSequence={setSequence}
              program={program}
              setProgram={setProgram}
              activeProgram={activeProgram}
              entrezQuery={entrezQuery}
              setEntrezQuery={setEntrezQuery}
              evalue={evalue}
              setEvalue={setEvalue}
              hitlistSize={hitlistSize}
              setHitlistSize={setHitlistSize}
              advancedOpen={advancedOpen}
              setAdvancedOpen={setAdvancedOpen}
              onSubmit={handleSubmit}
            />
          )}

          {(phase === "submitted" || phase === "polling") && (
            <StatusPhase
              rid={rid}
              elapsedSeconds={elapsedSeconds}
              estimatedSeconds={estimatedSeconds}
              onCancel={resetToInput}
            />
          )}

          {phase === "results" && (
            <ResultsPhase
              hits={hits}
              program={program}
              database={database}
              rid={rid}
              queryLength={queryLength}
              expandedHit={expandedHit}
              setExpandedHit={setExpandedHit}
              onNewSearch={resetToInput}
            />
          )}

          {phase === "error" && (
            <ErrorPhase errorMessage={errorMessage} onRetry={resetToInput} />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function InputPhase({
  sequence,
  setSequence,
  program,
  setProgram,
  activeProgram,
  entrezQuery,
  setEntrezQuery,
  evalue,
  setEvalue,
  hitlistSize,
  setHitlistSize,
  advancedOpen,
  setAdvancedOpen,
  onSubmit,
}: {
  sequence: string;
  setSequence: (v: string) => void;
  program: Program;
  setProgram: (v: Program) => void;
  activeProgram: (typeof PROGRAMS)[number];
  entrezQuery: string;
  setEntrezQuery: (v: string) => void;
  evalue: string;
  setEvalue: (v: string) => void;
  hitlistSize: number;
  setHitlistSize: (v: number) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (v: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "20px",
        }}
        className="db-blast-grid"
      >
        {/* Sequence input */}
        <div style={cardStyle}>
          <div
            style={{
              fontFamily: "Syne, var(--font-sans)",
              fontWeight: 700,
              fontSize: "14px",
              color: "#f1f5f9",
              marginBottom: "8px",
            }}
          >
            Query Sequence
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              color: "#475569",
              marginBottom: "12px",
            }}
          >
            Enter nucleotide or protein sequence in FASTA format or as a
            plain sequence string.
          </div>
          <textarea
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            placeholder={">example_sequence\nATGCATGCATGCATGC..."}
            style={{
              width: "100%",
              height: "200px",
              background: "#06081a",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "8px",
              padding: "12px",
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              resize: "vertical",
              lineHeight: 1.6,
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)")
            }
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "#475569",
              }}
            >
              {sequence.length} characters
            </span>
            <button
              onClick={() => setSequence(EXAMPLE_SEQUENCE)}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Load example
            </button>
          </div>
        </div>

        {/* Parameters */}
        <div style={cardStyle}>
          {/* Program */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontFamily: "Syne, var(--font-sans)",
                fontWeight: 700,
                fontSize: "13px",
                color: "#f1f5f9",
                marginBottom: "10px",
              }}
            >
              Program
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {PROGRAMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProgram(p.value)}
                  style={pillStyle(program === p.value)}
                >
                  {p.label} ({p.sub})
                </button>
              ))}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "#475569",
                marginTop: "8px",
              }}
            >
              {activeProgram.description}
            </div>
          </div>

          {/* Search scope */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontFamily: "Syne, var(--font-sans)",
                fontWeight: 700,
                fontSize: "13px",
                color: "#f1f5f9",
                marginBottom: "10px",
              }}
            >
              Search against
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {ENTREZ_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setEntrezQuery(opt.value)}
                  style={pillStyle(entrezQuery === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "#475569",
                marginTop: "8px",
              }}
            >
              {entrezQuery || "(no restriction)"}
            </div>
          </div>

          {/* Advanced */}
          <div>
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Advanced options {advancedOpen ? "▴" : "▾"}
            </button>
            {advancedOpen && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ flex: 1, minWidth: "120px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginBottom: "4px",
                    }}
                  >
                    E-value
                  </div>
                  <input
                    type="number"
                    value={evalue}
                    onChange={(e) => setEvalue(e.target.value)}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </label>
                <label style={{ flex: 1, minWidth: "120px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginBottom: "4px",
                    }}
                  >
                    Max hits
                  </div>
                  <input
                    type="number"
                    value={hitlistSize}
                    onChange={(e) =>
                      setHitlistSize(parseInt(e.target.value) || 50)
                    }
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={sequence.trim().length === 0}
        style={{
          width: "100%",
          background: "#6366f1",
          color: "#ffffff",
          border: "none",
          borderRadius: "9px",
          padding: "13px",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: "14px",
          letterSpacing: "0.04em",
          cursor: sequence.trim().length === 0 ? "not-allowed" : "pointer",
          opacity: sequence.trim().length === 0 ? 0.5 : 1,
          marginTop: "20px",
        }}
      >
        Run BLAST Search →
      </button>

      <style>{`
        @media (max-width: 800px) {
          .db-blast-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatusPhase({
  rid,
  elapsedSeconds,
  estimatedSeconds,
  onCancel,
}: {
  rid: string | null;
  elapsedSeconds: number;
  estimatedSeconds: number;
  onCancel: () => void;
}) {
  const pct = Math.min(100, (elapsedSeconds / Math.max(1, estimatedSeconds)) * 100);
  return (
    <div style={{ ...cardStyle, maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#6366f1",
          margin: "0 auto 20px",
          animation: "blastPulse 2s infinite",
        }}
      />
      <div
        style={{
          fontFamily: "Syne, var(--font-sans)",
          fontWeight: 700,
          fontSize: "18px",
          color: "#f1f5f9",
        }}
      >
        BLAST job submitted
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "#475569",
          marginTop: "6px",
        }}
      >
        Request ID: {rid || "…"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          color: "#94a3b8",
          marginTop: "10px",
        }}
      >
        Searching NCBI databases...
      </div>

      <div
        style={{
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#475569" }}>
          Elapsed: {elapsedSeconds}s
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#475569" }}>
          Estimated wait: ~{estimatedSeconds}s
        </span>
      </div>

      <div
        style={{
          background: "rgba(99,102,241,0.12)",
          borderRadius: "999px",
          height: "4px",
          width: "100%",
          maxWidth: "400px",
          margin: "16px auto 0",
        }}
      >
        <div
          style={{
            background: "#6366f1",
            borderRadius: "999px",
            height: "100%",
            width: `${pct}%`,
            transition: "width 1s linear",
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#475569",
          textAlign: "center",
          marginTop: "18px",
        }}
      >
        NCBI BLAST searches typically take 1–5 minutes depending on query
        length and server load.
      </div>

      <button
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          color: "#ef4444",
          fontSize: "12px",
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          marginTop: "18px",
        }}
      >
        Cancel and start over
      </button>
    </div>
  );
}

function ResultsPhase({
  hits,
  program,
  database,
  rid,
  queryLength,
  expandedHit,
  setExpandedHit,
  onNewSearch,
}: {
  hits: Hit[];
  program: Program;
  database: string;
  rid: string | null;
  queryLength: number;
  expandedHit: number | null;
  setExpandedHit: (v: number | null) => void;
  onNewSearch: () => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Syne, var(--font-sans)",
              fontWeight: 800,
              fontSize: "22px",
              color: "#f1f5f9",
            }}
          >
            {hits.length} hits found
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#475569",
              marginTop: "4px",
            }}
          >
            Program: {program} · Database: {database} · RID: {rid} · Query
            length: {queryLength} bp
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href={`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${rid}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#6366f1",
              fontSize: "12px",
              fontFamily: "var(--font-sans)",
              textDecoration: "none",
            }}
          >
            View on NCBI →
          </a>
          <button
            onClick={onNewSearch}
            style={{
              background: "transparent",
              color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "7px",
              padding: "7px 16px",
              fontSize: "12px",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            New search
          </button>
        </div>
      </div>

      {hits.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}>
          <div
            style={{
              fontFamily: "Syne, var(--font-sans)",
              fontWeight: 700,
              fontSize: "18px",
              color: "#f1f5f9",
            }}
          >
            No significant hits found.
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "#94a3b8",
              marginTop: "8px",
            }}
          >
            Try relaxing your E-value threshold or broadening the search
            scope beyond O. taurus.
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
              }}
            >
              <thead>
                <tr style={{ background: "rgba(99,102,241,0.07)" }}>
                  {[
                    "#",
                    "Description",
                    "Scientific Name",
                    "Score",
                    "E-value",
                    "Identity",
                    "Coverage",
                    "Accession",
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "#475569",
                        borderBottom: "1px solid rgba(99,102,241,0.12)",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hits.map((hit, i) => {
                  const desc = hit.description?.[0];
                  const hsp = hit.hsps?.[0];
                  if (!hsp) return null;
                  const identityPct = Math.round(
                    (hsp.identity / hsp.align_len) * 100
                  );
                  const coveragePct = Math.round(
                    (Math.abs(hsp.query_to - hsp.query_from + 1) / queryLength) *
                      100
                  );
                  const isExpanded = expandedHit === i;
                  return (
                    <>
                      <tr
                        key={desc?.accession || i}
                        onClick={() =>
                          setExpandedHit(isExpanded ? null : i)
                        }
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          background: isExpanded
                            ? "rgba(99,102,241,0.06)"
                            : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded)
                            e.currentTarget.style.background =
                              "rgba(99,102,241,0.04)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "9px 14px", color: "#475569" }}>
                          {i + 1}
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#f1f5f9",
                            maxWidth: "260px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {desc?.title}
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#94a3b8",
                            fontStyle: "italic",
                          }}
                        >
                          {desc?.sciname || "—"}
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#94a3b8",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                          }}
                        >
                          {hsp.score}
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#94a3b8",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                          }}
                        >
                          {hsp.evalue}
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#10b981",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                          }}
                        >
                          {identityPct}%
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#06b6d4",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                          }}
                        >
                          {coveragePct}%
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#6366f1",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11.5px",
                          }}
                        >
                          {desc?.accession}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <AlignmentView hsp={hsp} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AlignmentView({ hsp }: { hsp: Hsp }) {
  const blocks = buildAlignmentBlocks(
    hsp.qseq,
    hsp.hseq,
    hsp.midline,
    hsp.query_from,
    hsp.query_to,
    hsp.hit_from,
    hsp.hit_to
  );

  return (
    <div
      style={{
        background: "#06081a",
        padding: "16px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "#94a3b8",
        borderTop: "1px solid rgba(99,102,241,0.1)",
      }}
    >
      {blocks.map((b, i) => (
        <div key={i} style={{ marginBottom: "10px", whiteSpace: "pre" }}>
          <div>
            Query {String(b.qStart).padEnd(8)}
            <SeqLine line={b.qLine} midline={b.mLine} /> {b.qEnd}
          </div>
          <div style={{ color: "#475569" }}>{"       ".padEnd(9)}{b.mLine}</div>
          <div>
            Sbjct {String(b.hStart).padEnd(8)}
            <SeqLine line={b.hLine} midline={b.mLine} /> {b.hEnd}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorPhase({
  errorMessage,
  onRetry,
}: {
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <div style={{ ...cardStyle, maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
      <div
        style={{
          fontFamily: "Syne, var(--font-sans)",
          fontWeight: 700,
          fontSize: "18px",
          color: "#ef4444",
        }}
      >
        ⚠ BLAST search failed
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          color: "#94a3b8",
          marginTop: "10px",
        }}
      >
        {errorMessage ||
          "NCBI BLAST returned an error. This may be due to server load or an invalid sequence."}
      </div>
      <div
        style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        <button
          onClick={onRetry}
          style={{
            background: "#6366f1",
            color: "#ffffff",
            border: "none",
            borderRadius: "9px",
            padding: "9px 20px",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="https://blast.ncbi.nlm.nih.gov"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#6366f1",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
            alignSelf: "center",
            textDecoration: "none",
          }}
        >
          Check NCBI BLAST status
        </a>
      </div>
    </div>
  );
}
