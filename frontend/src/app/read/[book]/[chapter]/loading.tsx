export default function Loading() {
  return (
    <div className="reader-viewport flex overflow-hidden">
      {/* Sidebar skeleton (lg only) */}
      <aside className="hidden lg:flex flex-col w-52 xl:w-56 shrink-0 h-full border-r border-[#E1DDD8] dark:border-stone-700 bg-[#FAF9F7] dark:bg-stone-950">
        <div className="h-14 flex items-center px-4 border-b border-[#E1DDD8] dark:border-stone-700">
          <div className="h-4 w-28 bg-stone-200 dark:bg-stone-700 rounded animate-pulse" />
        </div>
        <div className="px-3 py-3 border-b border-[#E1DDD8] dark:border-stone-700">
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className="h-7 bg-stone-100 dark:bg-stone-800 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="flex-1 px-3 py-3">
          <div className="h-3 w-12 bg-stone-200 dark:bg-stone-700 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }, (_, i) => (
              <div
                key={i}
                className="h-9 bg-stone-100 dark:bg-stone-800 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header skeleton */}
        <header className="lg:hidden shrink-0 z-10 bg-[#FAF9F7]/90 dark:bg-stone-950/90 border-b border-[#E1DDD8] dark:border-stone-700">
          <div className="px-4 sm:px-6 flex items-center h-14 gap-4">
            <div className="h-7 w-48 bg-stone-200 dark:bg-stone-700 rounded animate-pulse" />
            <div className="ml-auto flex gap-2">
              <div className="h-7 w-20 bg-stone-200 dark:bg-stone-700 rounded animate-pulse" />
            </div>
          </div>
        </header>

        {/* Main content skeleton */}
        <main className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-transparent">
              <div className="space-y-3">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-5 h-4 bg-stone-200 dark:bg-stone-700 rounded animate-pulse shrink-0" />
                    <div
                      className="h-4 bg-stone-100 dark:bg-stone-800 rounded animate-pulse"
                      style={{ width: `${55 + ((i * 17) % 40)}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block w-px bg-[#E1DDD8] dark:bg-stone-700 shrink-0" />

            <div className="lg:w-96 xl:w-[440px] shrink-0 px-4 sm:px-6 py-6 bg-[#F1EEE9] dark:bg-stone-950/50">
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="text-3xl mb-3 opacity-30">&#x2B21;</div>
                <div className="h-4 w-56 bg-stone-200 dark:bg-stone-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
