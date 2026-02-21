"use client";

import useSWR, { mutate } from "swr";
import Link from "next/link";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-sm" style={{ color: s <= Math.round(value) ? "var(--accent)" : "var(--border)" }}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

type BookStatus = "all" | "current" | "completed" | "upcoming";
const statusTabs: { key: BookStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "current", label: "Current" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

export default function BooksPage() {
  const [tab, setTab] = useState<BookStatus>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", genre: "", coverUrl: "", libbyUrl: "", amazonUrl: "", kindleUrl: "", bookshopUrl: "" });
  const [submitting, setSubmitting] = useState(false);

  const url = tab === "all" ? "/api/books" : `/api/books?status=${tab}`;
  const { data: books } = useSWR(url, fetcher);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", author: "", genre: "", coverUrl: "", libbyUrl: "", amazonUrl: "", kindleUrl: "", bookshopUrl: "" });
    setShowAdd(false);
    setSubmitting(false);
    mutate(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
          Books
        </h1>
        <button className="btn-primary text-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "Add Book"}
        </button>
      </div>

      {/* Add book form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card flex flex-col gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Title *</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Author *</label>
              <input className="input" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Genre</label>
              <input className="input" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Cover Image URL</label>
              <input className="input" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
            </div>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium" style={{ color: "var(--primary)" }}>Purchase / Borrow Links</summary>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Libby URL</label>
                <input className="input" value={form.libbyUrl} onChange={(e) => setForm({ ...form, libbyUrl: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Amazon URL</label>
                <input className="input" value={form.amazonUrl} onChange={(e) => setForm({ ...form, amazonUrl: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Kindle URL</label>
                <input className="input" value={form.kindleUrl} onChange={(e) => setForm({ ...form, kindleUrl: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Bookshop.org URL</label>
                <input className="input" value={form.bookshopUrl} onChange={(e) => setForm({ ...form, bookshopUrl: e.target.value })} />
              </div>
            </div>
          </details>
          <button type="submit" className="btn-primary text-sm self-start" disabled={submitting}>
            {submitting ? "Adding..." : "Add Book"}
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {statusTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors bg-transparent cursor-pointer"
            style={{
              borderColor: tab === t.key ? "var(--primary)" : "transparent",
              color: tab === t.key ? "var(--primary)" : "var(--muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Book list */}
      {!books ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>
      ) : !books.length ? (
        <div className="card text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="font-medium" style={{ color: "var(--muted)" }}>No books yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Add a book to get started!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {books.map((book: { id: string; title: string; author: string; genre: string; status: string; avg_rating: number; rating_count: number; question_count: number; cover_url: string }) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="card flex items-start gap-4 no-underline transition-shadow hover:shadow-md"
              style={{ color: "var(--foreground)" }}
            >
              <div
                className="w-16 h-22 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <svg className="w-6 h-6" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base">{book.title}</h3>
                  <span
                    className="badge flex-shrink-0"
                    style={{
                      background: book.status === "current" ? "#ece0e6" : book.status === "completed" ? "#e4e4d2" : "#e8e8d6",
                      color: book.status === "current" ? "#8f6278" : book.status === "completed" ? "#6e6f3a" : "#7a7b3f",
                    }}
                  >
                    {book.status}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--muted)" }}>{book.author}</p>
                {book.genre && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{book.genre}</p>}
                <div className="flex items-center gap-3 mt-2">
                  {Number(book.avg_rating) > 0 && (
                    <span className="flex items-center gap-1 text-xs">
                      <Stars value={Number(book.avg_rating)} />
                      <span style={{ color: "var(--muted)" }}>({book.rating_count})</span>
                    </span>
                  )}
                  {Number(book.question_count) > 0 && (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {book.question_count} question{Number(book.question_count) !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
