import Link from "next/link";
import QuizApp from "@/components/QuizApp";

// Server Component: rendert den statischen Rahmen; die interaktive QuizApp ist eine Client Component.
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">KI-Sportquiz</h1>
      <p className="mt-2 text-slate-600">
        Quizfragen aus aktuellen Tabellen und Ergebnissen, erzeugt mit der OpenAI-API.{" "}
        <Link href="/data" className="underline">
          Datenbasis ansehen
        </Link>
      </p>
      <QuizApp />
    </main>
  );
}
