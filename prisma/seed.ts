import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: path.join(process.cwd(), "dev.db"),
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as PrismaClient;

async function main() {
  // Members
  const members = await Promise.all([
    prisma.member.upsert({ where: { name: "Alice" }, update: {}, create: { name: "Alice" } }),
    prisma.member.upsert({ where: { name: "Ben" }, update: {}, create: { name: "Ben" } }),
    prisma.member.upsert({ where: { name: "Clara" }, update: {}, create: { name: "Clara" } }),
    prisma.member.upsert({ where: { name: "David" }, update: {}, create: { name: "David" } }),
    prisma.member.upsert({ where: { name: "Elena" }, update: {}, create: { name: "Elena" } }),
  ]);
  console.log("✓ Members seeded");

  // Books
  const book1 = await prisma.book.upsert({
    where: { id: "book-1" },
    update: {},
    create: {
      id: "book-1",
      title: "The Midnight Library",
      author: "Matt Haig",
      genre: "Literary Fiction",
      status: "COMPLETED",
      completedAt: new Date("2024-10-15"),
      coverUrl: "https://covers.openlibrary.org/b/id/10909258-L.jpg",
      description:
        "Between life and death there is a library, and within that library, the shelves go on forever.",
      libbySUrl: "https://libbyapp.com/search/overdrive-default/search/query-the-midnight-library",
      kindleUrl: "https://www.amazon.com/Midnight-Library-Novel-Matt-Haig-ebook/dp/B085M7WCXZ",
      amazonUrl: "https://www.amazon.com/Midnight-Library-Novel-Matt-Haig/dp/0525559477",
      bookshopUrl: "https://bookshop.org/p/books/the-midnight-library-matt-haig/15199727",
      reviewLinks: JSON.stringify([
        { label: "NYT Review", url: "https://www.nytimes.com/2020/09/28/books/review/the-midnight-library-matt-haig.html" },
        { label: "The Guardian", url: "https://www.theguardian.com/books/2020/aug/13/the-midnight-library-by-matt-haig-review" },
      ]),
    },
  });

  const book2 = await prisma.book.upsert({
    where: { id: "book-2" },
    update: {},
    create: {
      id: "book-2",
      title: "Demon Copperhead",
      author: "Barbara Kingsolver",
      genre: "Literary Fiction",
      status: "COMPLETED",
      completedAt: new Date("2024-12-10"),
      coverUrl: "https://covers.openlibrary.org/b/id/13191531-L.jpg",
      description:
        "A Pulitzer Prize-winning reimagining of David Copperfield set in Appalachian Virginia.",
      libbySUrl: "https://libbyapp.com/search/overdrive-default/search/query-demon-copperhead",
      kindleUrl: "https://www.amazon.com/Demon-Copperhead-Novel-Barbara-Kingsolver-ebook/dp/B09NZX3FPR",
      amazonUrl: "https://www.amazon.com/Demon-Copperhead-Novel-Barbara-Kingsolver/dp/0063251922",
      bookshopUrl: "https://bookshop.org/p/books/demon-copperhead-barbara-kingsolver/18113533",
      reviewLinks: JSON.stringify([
        { label: "NPR Review", url: "https://www.npr.org/2022/10/18/1129679722/demon-copperhead-kingsolver-review" },
      ]),
    },
  });

  const book3 = await prisma.book.upsert({
    where: { id: "book-3" },
    update: {},
    create: {
      id: "book-3",
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      author: "Gabrielle Zevin",
      genre: "Literary Fiction",
      status: "CURRENT",
      coverUrl: "https://covers.openlibrary.org/b/id/12884889-L.jpg",
      description:
        "A sweeping story of friendship, love, and video games spanning thirty years.",
      libbySUrl: "https://libbyapp.com/search/overdrive-default/search/query-tomorrow-and-tomorrow",
      kindleUrl: "https://www.amazon.com/Tomorrow-Novel-Gabrielle-Zevin-ebook/dp/B09HKWG5PQ",
      amazonUrl: "https://www.amazon.com/Tomorrow-Novel-Gabrielle-Zevin/dp/0593321200",
      bookshopUrl: "https://bookshop.org/p/books/tomorrow-and-tomorrow-and-tomorrow-gabrielle-zevin/17741439",
      reviewLinks: JSON.stringify([
        { label: "NYT Review", url: "https://www.nytimes.com/2022/07/05/books/review/tomorrow-and-tomorrow-and-tomorrow-gabrielle-zevin.html" },
        { label: "Goodreads", url: "https://www.goodreads.com/book/show/58784475-tomorrow-and-tomorrow-and-tomorrow" },
      ]),
    },
  });

  console.log("✓ Books seeded");

  // Ratings for completed books
  const ratingsData = [
    { bookId: book1.id, memberName: "Alice", rating: 5, review: "Absolutely loved the concept and execution." },
    { bookId: book1.id, memberName: "Ben", rating: 4, review: "Beautiful and moving, though a bit slow at times." },
    { bookId: book1.id, memberName: "Clara", rating: 4 },
    { bookId: book1.id, memberName: "David", rating: 3, review: "Interesting premise but felt predictable." },
    { bookId: book1.id, memberName: "Elena", rating: 5, review: "Cried multiple times. An instant favourite." },
    { bookId: book2.id, memberName: "Alice", rating: 5, review: "Kingsolver at her absolute best." },
    { bookId: book2.id, memberName: "Ben", rating: 5 },
    { bookId: book2.id, memberName: "Clara", rating: 4, review: "Devastating and brilliant." },
    { bookId: book2.id, memberName: "David", rating: 4 },
    { bookId: book2.id, memberName: "Elena", rating: 5, review: "One of the best books I've ever read." },
    // Partial ratings for current book
    { bookId: book3.id, memberName: "Alice", rating: 5, review: "Can't put it down!" },
    { bookId: book3.id, memberName: "Clara", rating: 4 },
  ];

  for (const r of ratingsData) {
    await prisma.rating.upsert({
      where: { bookId_memberName: { bookId: r.bookId, memberName: r.memberName } },
      update: {},
      create: r,
    });
  }
  console.log("✓ Ratings seeded");

  // Meetings
  const meeting1 = await prisma.meeting.upsert({
    where: { id: "meeting-1" },
    update: {},
    create: {
      id: "meeting-1",
      bookId: book1.id,
      scheduledDate: new Date("2024-10-15T19:00:00"),
      location: "Alice's Place",
      locationNotes: "Ring the bell, third floor",
      locationAccessibility: "No elevator — stairs only",
      hostName: "Alice",
      status: "COMPLETED",
    },
  });

  const meeting2 = await prisma.meeting.upsert({
    where: { id: "meeting-2" },
    update: {},
    create: {
      id: "meeting-2",
      bookId: book2.id,
      scheduledDate: new Date("2024-12-10T19:00:00"),
      location: "Ben's Apartment",
      locationNotes: "Park on the street, unit 4B",
      locationAccessibility: "Elevator available",
      hostName: "Ben",
      status: "COMPLETED",
    },
  });

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(15);
  nextMonth.setHours(19, 0, 0, 0);

  const meeting3 = await prisma.meeting.upsert({
    where: { id: "meeting-3" },
    update: {},
    create: {
      id: "meeting-3",
      bookId: book3.id,
      scheduledDate: nextMonth,
      location: "Clara's House",
      locationNotes: "Enter through the back garden gate",
      locationAccessibility: "Step-free access via back gate",
      hostName: "Clara",
      status: "SCHEDULED",
    },
  });

  console.log("✓ Meetings seeded");

  // Discussion questions for current book
  const questions = [
    { bookId: book3.id, question: "How does the game Ichigo define the characters' identities and relationships throughout the novel?", submittedBy: "Alice" },
    { bookId: book3.id, question: "What does the novel say about the nature of creative collaboration — can it ever truly be equal?", submittedBy: "Ben" },
    { bookId: book3.id, question: "How does the passage of time function as both a plot device and a thematic element?", submittedBy: "Clara" },
    { bookId: book1.id, question: "If you could visit one version of your life in the Midnight Library, which would it be?", submittedBy: "Elena" },
    { bookId: book1.id, question: "What does Nora's story say about regret and the choices we make?", submittedBy: "David" },
  ];

  for (const q of questions) {
    const existing = await prisma.discussionQuestion.findFirst({ where: { bookId: q.bookId, submittedBy: q.submittedBy, question: q.question } });
    if (!existing) {
      await prisma.discussionQuestion.create({ data: q });
    }
  }
  console.log("✓ Discussion questions seeded");

  // Availability poll for upcoming meeting
  const twoWeeks = new Date();
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  const threeWeeks = new Date();
  threeWeeks.setDate(threeWeeks.getDate() + 21);
  const fourWeeks = new Date();
  fourWeeks.setDate(fourWeeks.getDate() + 28);

  const existingPoll = await prisma.availabilityPoll.findFirst({ where: { meetingId: meeting3.id } });
  let poll = existingPoll;
  if (!poll) {
    poll = await prisma.availabilityPoll.create({
      data: {
        meetingId: meeting3.id,
        proposedDates: JSON.stringify([
          twoWeeks.toISOString(),
          threeWeeks.toISOString(),
          fourWeeks.toISOString(),
        ]),
      },
    });
  }

  // Some responses
  const responses = [
    { memberName: "Alice", availableDates: [twoWeeks, threeWeeks] },
    { memberName: "Ben", availableDates: [threeWeeks, fourWeeks] },
    { memberName: "Clara", availableDates: [twoWeeks, threeWeeks, fourWeeks] },
    { memberName: "David", availableDates: [fourWeeks] },
  ];

  for (const r of responses) {
    await prisma.availabilityResponse.upsert({
      where: { pollId_memberName: { pollId: poll.id, memberName: r.memberName } },
      update: {},
      create: {
        pollId: poll.id,
        memberName: r.memberName,
        availableDates: JSON.stringify(r.availableDates.map((d) => d.toISOString())),
      },
    });
  }
  console.log("✓ Availability poll seeded");

  // Book nominations
  const nominations = [
    { title: "James", author: "Percival Everett", genre: "Literary Fiction", nominatedBy: "Alice", description: "A reimagining of Adventures of Huckleberry Finn from Jim's perspective." },
    { title: "The Women", author: "Kristin Hannah", genre: "Historical Fiction", nominatedBy: "Elena", description: "A story of women who served as Army nurses in Vietnam." },
    { title: "All Fours", author: "Miranda July", genre: "Literary Fiction", nominatedBy: "Ben", description: "A wild, funny, and deeply felt novel about desire and transformation." },
    { title: "Intermezzo", author: "Sally Rooney", genre: "Literary Fiction", nominatedBy: "Clara", description: "Two grieving brothers fall for very different women." },
  ];

  const createdNominations = [];
  for (const n of nominations) {
    const existing = await prisma.bookNomination.findFirst({ where: { title: n.title, nominatedBy: n.nominatedBy } });
    if (!existing) {
      createdNominations.push(await prisma.bookNomination.create({ data: n }));
    } else {
      createdNominations.push(existing);
    }
  }

  // Votes on nominations
  const voteData = [
    { nominationIdx: 0, voters: ["Ben", "Clara", "David", "Elena"] },
    { nominationIdx: 1, voters: ["Alice", "Clara", "Elena"] },
    { nominationIdx: 2, voters: ["Alice", "David"] },
    { nominationIdx: 3, voters: ["Alice", "Ben", "Elena"] },
  ];

  for (const { nominationIdx, voters } of voteData) {
    const nom = createdNominations[nominationIdx];
    if (!nom) continue;
    for (const voterName of voters) {
      await prisma.bookVote.upsert({
        where: { nominationId_voterName: { nominationId: nom.id, voterName } },
        update: {},
        create: { nominationId: nom.id, voterName },
      });
    }
  }
  console.log("✓ Nominations & votes seeded");

  // Host rotation
  const rotationOrder = [
    { memberName: "Alice", order: 1, lastHostedAt: new Date("2024-10-15") },
    { memberName: "Ben", order: 2, lastHostedAt: new Date("2024-12-10") },
    { memberName: "Clara", order: 3 },
    { memberName: "David", order: 4 },
    { memberName: "Elena", order: 5, optOut: true },
  ];

  for (const r of rotationOrder) {
    await prisma.hostRotation.upsert({
      where: { memberName: r.memberName },
      update: {},
      create: r,
    });
  }
  console.log("✓ Host rotation seeded");

  console.log("\n🎉 Database seeded successfully!");
  console.log(`   Password to log in: bookclub123`);
  console.log(`   Try members: Alice, Ben, Clara, David, Elena`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
