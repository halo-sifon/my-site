"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import MobileMenu from "./MobileMenu";

const navItems = [
  { name: "首页", href: "/" },
  { name: "文章", href: "/articles" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 nav-bar border-b border-hairline">
        <nav className="mx-auto max-w-5xl px-4 h-full flex items-center justify-between">
          <Link
            href="/"
            className="text-ink text-body-sm-strong"
          >
            sifon
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-body transition-colors hover:text-ink ${
                    isActive ? "text-ink" : ""
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <button
            className="md:hidden text-ink p-2 -mr-2"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="打开菜单"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </nav>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        currentPath={pathname}
      />
    </>
  );
}
