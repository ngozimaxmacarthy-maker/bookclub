import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [completedBooks, allRatings, members] = await Promise.all([
    prisma.book.findMany({
      where: { status: "COMPLETED" },
      include: { ratings: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.rating.findMany(),
    prisma.member.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Genre breakdown
  const genreCounts: Record<string, number> = {};
  completedBooks.forEach((b) => {
    const g = b.genre ?? "Unknown";
    genreCounts[g] = (genreCounts[g] ?? 0) + 1;
  });

  // Average group rating per book
  const booksWithAvg = completedBooks.map((book) => {
    const avg =
      book.ratings.length > 0
        ? book.ratings.reduce((sum, r) => sum + r.rating, 0) / book.ratings.length
        : null;
    return { ...book, avgRating: avg };
  });

  // Overall avg rating
  const overallAvg =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : null;

  // Member stats
  const memberStats = members.map((m) => {
    const myRatings = allRatings.filter((r) => r.memberName === m.name);
    const avg =
      myRatings.length > 0
        ? myRatings.reduce((s, r) => s + r.rating, 0) / myRatings.length
        : null;
    return { name: m.name, ratingCount: myRatings.length, avgRating: avg };
  });

  return NextResponse.json({
    totalBooks: completedBooks.length,
    overallAvgRating: overallAvg,
    genreCounts,
    books: booksWithAvg,
    memberStats,
  });
}
