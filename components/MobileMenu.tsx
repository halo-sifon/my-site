"use client";

import Link from "next/link";

interface NavItem {
  name: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
}

export default function MobileMenu({
  isOpen,
  onClose,
  navItems,
  currentPath,
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0 bg-primary flex flex-col">
        <div className="h-16 px-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="text-on-primary p-2 -mr-2"
            aria-label="关闭菜单"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 flex flex-col justify-center px-8">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`text-on-primary text-display-sm py-4 border-b border-white/10 ${
                  isActive ? "text-on-primary" : ""
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
