import { ScoreMark } from "@/components/ui";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <ScoreMark size={44} spin value={0.7} />
      <p className="font-data text-xs uppercase tracking-[0.2em] text-text-faint">Mesure</p>
    </main>
  );
}
