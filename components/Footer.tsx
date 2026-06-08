import Link from "next/link";

const footerLinks = [
  { name: "首页", href: "/" },
  { name: "测试", href: "/test" },
];

export default function Footer() {
  return (
    <footer className="footer-vercel">
      <div className="mx-auto max-w-5xl p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 sifon. All rights reserved.</p>

          <nav className="flex flex-wrap justify-center gap-3 md:gap-6">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-ink transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
