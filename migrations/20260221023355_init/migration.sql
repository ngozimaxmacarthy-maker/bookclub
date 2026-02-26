-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "genre" TEXT,
    "coverUrl" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "libbySUrl" TEXT,
    "kindleUrl" TEXT,
    "amazonUrl" TEXT,
    "bookshopUrl" TEXT,
    "reviewLinks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "BookNomination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "genre" TEXT,
    "description" TEXT,
    "nominatedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookNomination_nominatedBy_fkey" FOREIGN KEY ("nominatedBy") REFERENCES "Member" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nominationId" TEXT NOT NULL,
    "voterName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookVote_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "BookNomination" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookVote_voterName_fkey" FOREIGN KEY ("voterName") REFERENCES "Member" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "location" TEXT,
    "locationNotes" TEXT,
    "locationAccessibility" TEXT,
    "hostName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meeting_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Meeting_hostName_fkey" FOREIGN KEY ("hostName") REFERENCES "Member" ("name") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilityPoll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "proposedDates" TEXT NOT NULL,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilityPoll_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilityResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "availableDates" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilityResponse_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "AvailabilityPoll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AvailabilityResponse_memberName_fkey" FOREIGN KEY ("memberName") REFERENCES "Member" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscussionQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscussionQuestion_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscussionQuestion_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "Member" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_memberName_fkey" FOREIGN KEY ("memberName") REFERENCES "Member" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HostRotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "optOut" BOOLEAN NOT NULL DEFAULT false,
    "lastHostedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HostRotation_memberName_fkey" FOREIGN KEY ("memberName") REFERENCES "Member" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BookVote_nominationId_voterName_key" ON "BookVote"("nominationId", "voterName");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityResponse_pollId_memberName_key" ON "AvailabilityResponse"("pollId", "memberName");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_bookId_memberName_key" ON "Rating"("bookId", "memberName");

-- CreateIndex
CREATE UNIQUE INDEX "HostRotation_memberName_key" ON "HostRotation"("memberName");
