"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Index" },
  { href: "/genome-browser/otaurus", label: "Genome Browser" },
  { href: "/distribution", label: "Distribution" },
  { href: "/resources", label: "Resources" },
  { href: "/downloads", label: "Downloads" },
  { href: "/datasets", label: "Datasets" },
  { href: "/literature", label: "Literature" },
  { href: "/people", label: "People" },
];

function RollText({ label }: { label: string }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        height: "1.15em",
        overflow: "hidden",
      }}
    >
      <motion.span
        variants={{ rest: { y: "0%" }, hover: { y: "-110%" } }}
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ display: "block" }}
      >
        {label}
      </motion.span>
      <motion.span
        variants={{ rest: { y: "110%" }, hover: { y: "0%" } }}
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          display: "block",
          position: "absolute",
          left: 0,
          top: 0,
          color: "var(--db-cyan)",
        }}
      >
        {label}
      </motion.span>
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          position: "fixed",
          inset: "0 0 auto 0",
          height: "72px",
          zIndex: 80,
          borderBottom: scrolled
            ? "1px solid rgba(244,241,232,0.13)"
            : "1px solid transparent",
          background: scrolled ? "rgba(3,3,3,0.76)" : "rgba(3,3,3,0.18)",
          backdropFilter: "blur(26px)",
          WebkitBackdropFilter: "blur(26px)",
        }}
      >
        <div
          style={{
            height: "100%",
            maxWidth: "1540px",
            margin: "0 auto",
            padding: "0 1.25rem",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
              }}
            >
              <Image src="/media/Logo.png" alt="DB² Logo" width={52} height={52} />
            </motion.div>
          </Link>

          <nav
            className="hidden lg:flex"
            style={{
              justifyContent: "center",
              alignItems: "center",
              gap: "1.15rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                  <motion.span
                    initial="rest"
                    animate="rest"
                    whileHover="hover"
                    style={{
                      color: active ? "var(--db-cyan)" : "var(--db-stone)",
                      opacity: active ? 1 : 0.78,
                    }}
                  >
                    <RollText label={link.label} />
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex" style={{ justifyContent: "flex-end" }}>
            <Link href="/genome-browser/otaurus" className="db-magnetic-link">
              Launch
            </Link>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            style={{
              justifySelf: "end",
              border: "1px solid rgba(244,241,232,0.14)",
              background: "rgba(255,255,255,0.035)",
              color: "var(--db-cream)",
              borderRadius: "999px",
              width: "42px",
              height: "42px",
              display: "grid",
              placeItems: "center",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              {open ? "×" : "≡"}
            </span>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              top: "72px",
              left: 0,
              right: 0,
              zIndex: 70,
              background: "rgba(3,3,3,0.94)",
              backdropFilter: "blur(28px)",
              borderBottom: "1px solid rgba(244,241,232,0.13)",
              padding: "1.2rem",
            }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "block",
                  padding: "1rem 0",
                  color: pathname === link.href ? "var(--db-cyan)" : "var(--db-cream)",
                  textDecoration: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid rgba(244,241,232,0.1)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}