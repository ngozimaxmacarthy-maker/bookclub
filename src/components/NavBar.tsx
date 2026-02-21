"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/nominations", label: "Vote" },
  { href: "/meetings", label: "Meetings" },
  { href: "/history", label: "History" },
  { href: "/hosts", label: "Hosts" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [memberName, setMemberName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn) setMemberName(data.memberName);
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <nav style={{ background: "var(--primary)" }}>
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link
          href="/dashboard"
          className="text-white text-xl font-bold tracking-wide font-serif"
        >
          Book Club
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                style={{
                  color: active ? "white" : "rgba(255,255,255,0.75)",
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {memberName ? (
            <>
              <span className="text-white/80 text-sm">{memberName}</span>
              <button
                onClick={handleLogout}
                className="text-white/70 hover:text-white text-sm underline bg-transparent border-none cursor-pointer"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/" className="text-white/80 hover:text-white text-sm underline">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white bg-transparent border-none cursor-pointer p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/20 px-4 pb-3">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium"
                style={{ color: active ? "white" : "rgba(255,255,255,0.75)" }}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-white/20 mt-2 pt-2">
            {memberName ? (
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">{memberName}</span>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="text-white/70 hover:text-white text-sm underline bg-transparent border-none cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-white/80 text-sm underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
