"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const memberLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/nominations", label: "Vote" },
  { href: "/meetings", label: "Meetings" },
  { href: "/history", label: "History" },
  { href: "/hosts", label: "Hosts" },
];

const adminLinks = [
  ...memberLinks,
  { href: "/admin", label: "Admin" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "member" | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn) {
          setMemberName(data.memberName);
          setRole(data.role ?? "member");
        }
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const navLinks = role === "admin" ? adminLinks : memberLinks;

  return (
    <nav style={{ background: "var(--nav-bg)" }}>
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/dashboard" className="text-white text-xl font-bold tracking-wide font-serif">
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

        <div className="hidden md:flex items-center gap-2">
          {memberName ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors hover:bg-white/15"
                title="My Profile"
              >
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="text-white/80 text-sm">{memberName}</span>
                {role === "admin" && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                    Admin
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-white/60 hover:text-white text-sm bg-transparent border-none cursor-pointer px-1"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/" className="text-white/80 hover:text-white text-sm underline">Sign in</Link>
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
              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-white/80 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {memberName}{role === "admin" && " (Admin)"} &mdash; Profile
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="text-white/60 hover:text-white text-sm underline bg-transparent border-none cursor-pointer text-left"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-white/80 text-sm underline">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
