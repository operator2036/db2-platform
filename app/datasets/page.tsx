"use client";

import { useState, useEffect, useMemo } from "react";
import PageShell from "@/components/site/PageShell";

type DatasetRow = Record<string, string>;

const ROWS_PER_PAGE = 25;

const STRATEGY_COLORS: Record<string, { bg: string; color: string }> = {
  WGS: { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
  "RNA-Seq": { bg: "rgba(6,182,212,0.12)", color: "#06b6d4" },
  "Targeted-Capture": { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  "RAD-Seq": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  "Hi-C": { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
};
const STRATEGY_FALLBACK = { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" };

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  GENOMIC: { bg: "rgba(99,102,241,0.1)", color: "#818cf8" },
  TRANSCRIPTOMIC: { bg: "rgba(6,182,212,0.1)", color: "#06b6d4" },
};
const SOURCE_FALLBACK = { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" };

function Pill({ label, colors }: { label: string; colors: { bg: string; color: string } }) {
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.color,
        borderRadius: "4px",
        padding: "2px 7px",
        fontSize: "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len).trim() + "…" : str;
}

export default function DatasetsPage() {
  const [data, setData] = useState<DatasetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStudy, setFilterStudy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((rows: DatasetRow[]) => {
        setData(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uniqueSpecies = useMemo(
    () => Array.from(new Set(data.map((r) => r["Species"]))).filter(Boolean).sort(),
    [data]
  );
  const uniqueStrategies = useMemo(
    () => Array.from(new Set(data.map((r) => r["Library Strategy"]))).filter(Boolean).sort(),
    [data]
  );
  const uniqueSources = useMemo(
    () => Array.from(new Set(data.map((r) => r["Library Source"]))).filter(Boolean).sort(),
    [data]
  );
  const uniqueStudies = useMemo(
    () => Array.from(new Set(data.map((r) => r["Study Title"]))).filter(Boolean).sort(),
    [data]
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.filter((row) => {
      if (filterSpecies && row["Species"] !== filterSpecies) return false;
      if (filterStrategy && row["Library Strategy"] !== filterStrategy) return false;
      if (filterSource && row["Library Source"] !== filterSource) return false;
      if (filterStudy && row["Study Title"] !== filterStudy) return false;
      if (q) {
        const matches = Object.values(row).some((v) => v.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [data, searchQuery, filterSpecies, filterStrategy, filterSource, filterStudy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSpecies, filterStrategy, filterSource, filterStudy]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ROWS_PER_PAGE));
  const pagedData = filteredData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const hasActiveFilters =
    !!searchQuery || !!filterSpecies || !!filterStrategy || !!filterSource || !!filterStudy;

  function clearFilters() {
    setSearchQuery("");
    setFilterSpecies("");
    setFilterStrategy("");
    setFilterSource("");
    setFilterStudy("");
  }

  const selectStyle: React.CSSProperties = {
    background: "#06081a",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "7px",
    padding: "8px 12px",
    color: "#94a3b8",
    fontFamily: "var(--font-sans)",
    fontSize: "13px",
    cursor: "pointer",
  };

  const start = filteredData.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(currentPage * ROWS_PER_PAGE, filteredData.length);

  const pageNumbers = useMemo(() => {
    const nums: (number | "…")[] = [];
    const maxShown = 5;
    if (totalPages <= maxShown) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
      return nums;
    }
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxShown - 1);
    startPage = Math.max(1, endPage - maxShown + 1);

    if (startPage > 1) {
      nums.push(1);
      if (startPage > 2) nums.push("…");
    }
    for (let i = startPage; i <= endPage; i++) nums.push(i);
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) nums.push("…");
      nums.push(totalPages);
    }
    return nums;
  }, [totalPages, currentPage]);

  function pageButtonStyle(active: boolean, disabled: boolean): React.CSSProperties {
    return {
      background: active ? "#6366f1" : "#06081a",
      border: `1px solid ${active ? "#6366f1" : "rgba(99,102,241,0.2)"}`,
      color: active ? "#ffffff" : "#94a3b8",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12.5px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.3 : 1,
      fontFamily: "var(--font-sans)",
    };
  }

  return (
    <PageShell>
      <div style={{ background: "#06081a", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "24px" }}>
          {/* ── Header ── */}
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
              SCARABAEINAE · NCBI SRA
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
              Genomic Datasets
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
              Genomic and transcriptomic datasets for Scarabaeinae (dung beetles)
              available in NCBI SRA. Includes whole-genome sequencing, RNA-seq,
              targeted capture, RAD-seq, and Hi-C datasets across {data.length}{" "}
              entries.
            </p>
          </div>

          {/* ── Search and filter bar ── */}
          <div
            style={{
              background: "#0c1028",
              border: "1px solid rgba(99,102,241,0.12)",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search species, title, institution, accession..."
              style={{
                flex: 1,
                minWidth: "220px",
                background: "#06081a",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "7px",
                padding: "8px 14px",
                color: "#f1f5f9",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)")}
            />

            <select
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Species</option>
              {uniqueSpecies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Strategies</option>
              {uniqueStrategies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Sources</option>
              {uniqueSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterStudy}
              onChange={(e) => setFilterStudy(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Studies</option>
              {uniqueStudies.map((s) => (
                <option key={s} value={s}>
                  {truncate(s, 40)}
                </option>
              ))}
            </select>

            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "#475569",
                whiteSpace: "nowrap",
                marginLeft: "auto",
              }}
            >
              {filteredData.length} datasets
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  background: "rgba(99,102,241,0.1)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Clear filters ×
              </button>
            )}
          </div>

          {/* ── Data table ── */}
          <div
            style={{
              background: "#0c1028",
              border: "1px solid rgba(99,102,241,0.12)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#475569",
                  padding: "60px",
                  fontSize: "14px",
                }}
              >
                Loading datasets...
              </div>
            ) : filteredData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#475569",
                  padding: "48px",
                }}
              >
                No datasets match your search.
              </div>
            ) : (
              <>
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
                          "Species",
                          "Title",
                          "Institution",
                          "Library Strategy",
                          "Library Source",
                          "Size (Mb)",
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
                      {pagedData.map((row, i) => (
                        <tr
                          key={row["Accession"] || i}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "rgba(99,102,241,0.04)")
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td
                            style={{
                              padding: "9px 14px",
                              verticalAlign: "top",
                              fontStyle: "italic",
                              color: "#f1f5f9",
                              fontWeight: 500,
                            }}
                          >
                            {row["Species"]}
                          </td>
                          <td style={{ padding: "9px 14px", verticalAlign: "top" }}>
                            <span
                              style={{
                                color: "#94a3b8",
                                maxWidth: "220px",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row["Title"]}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "9px 14px",
                              verticalAlign: "top",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            {row["Institution"]}
                          </td>
                          <td style={{ padding: "9px 14px", verticalAlign: "top" }}>
                            <Pill
                              label={row["Library Strategy"]}
                              colors={
                                STRATEGY_COLORS[row["Library Strategy"]] || STRATEGY_FALLBACK
                              }
                            />
                          </td>
                          <td style={{ padding: "9px 14px", verticalAlign: "top" }}>
                            <Pill
                              label={row["Library Source"]}
                              colors={SOURCE_COLORS[row["Library Source"]] || SOURCE_FALLBACK}
                            />
                          </td>
                          <td
                            style={{
                              padding: "9px 14px",
                              verticalAlign: "top",
                              color: "#64748b",
                              fontSize: "12px",
                              fontFamily: "var(--font-mono)",
                              textAlign: "right",
                            }}
                          >
                            {row["Size (Mb)"]}
                          </td>
                          <td style={{ padding: "9px 14px", verticalAlign: "top" }}>
                            <a
                              href={row["Link"]}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#6366f1",
                                fontFamily: "var(--font-mono)",
                                fontSize: "11.5px",
                                textDecoration: "none",
                              }}
                            >
                              {row["Accession"]}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(99,102,241,0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#0c1028",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11.5px",
                      color: "#475569",
                    }}
                  >
                    Showing {start}–{end} of {filteredData.length} datasets
                  </span>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={pageButtonStyle(false, currentPage === 1)}
                      onMouseEnter={(e) => {
                        if (currentPage === 1) return;
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                        e.currentTarget.style.color = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage === 1) return;
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      ← Prev
                    </button>

                    {pageNumbers.map((p, idx) =>
                      p === "…" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          style={{ color: "#475569", padding: "0 4px", fontSize: "12.5px" }}
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          style={pageButtonStyle(p === currentPage, false)}
                          onMouseEnter={(e) => {
                            if (p === currentPage) return;
                            e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                            e.currentTarget.style.color = "#f1f5f9";
                          }}
                          onMouseLeave={(e) => {
                            if (p === currentPage) return;
                            e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
                            e.currentTarget.style.color = "#94a3b8";
                          }}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={pageButtonStyle(false, currentPage === totalPages)}
                      onMouseEnter={(e) => {
                        if (currentPage === totalPages) return;
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                        e.currentTarget.style.color = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage === totalPages) return;
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
