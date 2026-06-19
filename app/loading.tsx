export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
      </div>
    </main>
  );
}
