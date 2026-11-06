import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ items: [] });

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Books API key not configured" }, { status: 500 });
  }

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=7&printType=books&key=${apiKey}`;
  const res = await fetch(url);
  const json = await res.json();

  const items = (json.items || []).map((item: {
    id: string;
    volumeInfo: {
      title?: string;
      authors?: string[];
      description?: string;
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    };
  }) => ({
    id: item.id,
    title: item.volumeInfo.title || "",
    author: item.volumeInfo.authors?.[0] || "",
    description: item.volumeInfo.description || "",
    cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || "",
  }));

  return NextResponse.json({ items });
}
