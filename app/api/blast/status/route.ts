import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const rid = request.nextUrl.searchParams.get("rid");
  if (!rid) return NextResponse.json({ error: "No RID" }, { status: 400 });

  const url = `https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=${rid}&FORMAT_TYPE=JSON2`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "DB2-DungBeetleDatabase/1.0 (pld59@msstate.edu)",
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (text.includes("Status=WAITING")) {
    return NextResponse.json({ status: "WAITING" });
  } else if (text.includes("Status=READY")) {
    return NextResponse.json({ status: "READY" });
  } else if (text.includes("Status=FAILED")) {
    return NextResponse.json({ status: "FAILED" });
  } else if (text.includes("Status=UNKNOWN")) {
    return NextResponse.json({ status: "UNKNOWN" });
  }

  return NextResponse.json({ status: "WAITING" });
}
