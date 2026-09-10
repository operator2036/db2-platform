import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { sequence, program, database, entrezQuery, evalue, hitlistSize } =
    await request.json();

  const params = new URLSearchParams({
    CMD: "Put",
    PROGRAM: program,
    DATABASE: database,
    QUERY: sequence,
    ENTREZ_QUERY: entrezQuery,
    HITLIST_SIZE: String(hitlistSize || 50),
    EXPECT: String(evalue || 0.001),
    FORMAT_TYPE: "JSON2",
    WORD_SIZE: program === "blastp" ? "3" : "11",
    FILTER: "L",
    TOOL: "db2-dung-beetle-database",
    EMAIL: "pld59@msstate.edu",
  });

  const res = await fetch("https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "DB2-DungBeetleDatabase/1.0 (pld59@msstate.edu)",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const text = await res.text();

  const ridMatch = text.match(/RID = (\S+)/);
  const rtoeMatch = text.match(/RTOE = (\d+)/);

  if (!ridMatch) {
    return NextResponse.json(
      { error: "Failed to submit BLAST job. NCBI did not return a RID." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    rid: ridMatch[1],
    estimatedSeconds: rtoeMatch ? parseInt(rtoeMatch[1]) : 60,
  });
}
