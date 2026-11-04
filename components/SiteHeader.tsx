import Link from "next/link";

const NAV = [
  { key: "quiz", href: "/", label: "Quiz" },
  { key: "data", href: "/data", label: "Datenbasis" },
] as const;

type Props = { current: (typeof NAV)[number]["key"] };

export default function SiteHeader({ current }: Props) {
  return (
    // Die Linie unten erinnert an eine Seitenauslinie
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-2 border-chalk/80 pb-4">
      <Link href="/" className="font-display text-5xl font-bold leading-none text-chalk sm:text-6xl">
        KI-Sportquiz
      </Link>
      <nav className="flex gap-5 text-lg">
        {NAV.map((item) => {
          const active = item.key === current;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`border-b-2 pb-0.5 ${
                active ? "border-flood text-chalk" : "border-transparent text-chalk-dim hover:text-chalk"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
