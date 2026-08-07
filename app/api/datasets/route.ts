import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  const csvPath = join(process.cwd(), "public", "scarabinae_genomics.csv");
  const raw = readFileSync(csvPath, "utf-8");

  const lines = raw.split("\n").filter((l) => l.trim() !== "");
  const headers = lines[0].split(",").map((h) => h.trim());

  const rows = lines
    .slice(1)
    .map((line) => {
      // Handle commas inside quoted fields
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          cols.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      cols.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (cols[i] || "").replace(/\[accn\]/g, "").trim();
      });
      return row;
    })
    .filter((r) => r["Species"] && r["Species"].length > 0);

  return NextResponse.json(rows, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
