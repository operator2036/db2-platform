import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const rid = request.nextUrl.searchParams.get("rid");
  if (!rid) return NextResponse.json({ error: "No RID" }, { status: 400 });

  // NCBI returns FORMAT_TYPE=JSON2 as a zip archive; JSON2_S returns the
  // unzipped single-query JSON we can parse directly.
  const url = `https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&FORMAT_TYPE=JSON2_S&RID=${rid}&HITLIST_SIZE=50&FORMAT_OBJECT=Alignment`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "DB2-DungBeetleDatabase/1.0 (pld59@msstate.edu)",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data);
}
