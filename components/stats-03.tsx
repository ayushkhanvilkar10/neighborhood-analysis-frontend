interface CrimeItem {
  offense: string;
  count: number;
}

interface Stats03Props {
  data: CrimeItem[];
  seriousTypes?: Set<string>;
}

export default function Stats03({ data, seriousTypes }: Stats03Props) {
  return (
    <div className="flex items-center justify-center w-full">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {data.map((item) => {
          const isSerious = seriousTypes?.has(item.offense) && item.count > 0;
          return (
            <div
              key={item.offense}
              className={`relative overflow-hidden rounded-xl p-4 border ${
                isSerious
                  ? "border-red-400/70 bg-white"
                  : "border-[#649E97]/25 bg-white"
              }`}
            >
              {isSerious && (
                <div
                  className="pointer-events-none absolute bottom-0 left-0 h-24 w-24"
                  style={{
                    background:
                      "radial-gradient(circle at bottom left, rgba(248,113,113,0.25) 0%, transparent 70%)",
                  }}
                />
              )}
              <dt className="relative text-xs font-semibold uppercase tracking-wide text-gray-500">{item.offense}</dt>
              <dd className="relative mt-2 flex items-baseline space-x-2.5">
                <span className="tabular-nums text-3xl font-semibold text-gray-900">
                  {item.count.toLocaleString()}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
