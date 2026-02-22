import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8&printType=books`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const results = (data.items || []).map((item: Record<string, unknown>) => {
      const info = item.volumeInfo as Record<string, unknown>;
      return {
        title: info.title || "",
        author: ((info.authors as string[]) || []).join(", "),
        description: (info.description as string || "").slice(0, 200),
        genre: ((info.categories as string[]) || [])[0] || "",
        cover: (info.imageLinks as Record<string, string>)?.thumbnail || null,
        goodreadsQuery: `https://www.goodreads.com/search?q=${encodeURIComponent(`${info.title} ${((info.authors as string[]) || []).join(" ")}`)}`,
      };
    });
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
