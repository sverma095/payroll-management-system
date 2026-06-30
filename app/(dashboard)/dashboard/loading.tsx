export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-6 w-40 bg-ink/10 rounded mb-2" />
      <div className="h-4 w-72 bg-ink/5 rounded mb-6" />
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 border-b border-line last:border-0 flex items-center px-5">
            <div className="h-3 w-full bg-ink/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
