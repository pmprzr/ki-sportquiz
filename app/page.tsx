import QuizApp from "@/components/QuizApp";
import SiteHeader from "@/components/SiteHeader";

// Server Component: statischer Rahmen. Die interaktive QuizApp ist eine Client Component.
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
      <SiteHeader current="quiz" />
      <p className="mt-5 max-w-prose text-lg text-chalk-dim">
        Die KI liest die aktuelle Tabelle und die letzten Spiele und stellt dir Fragen dazu. Zu jeder
        Antwort siehst du den Beleg aus den Daten.
      </p>
      <QuizApp />
    </main>
  );
}
