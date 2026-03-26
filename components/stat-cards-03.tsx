interface RequestItem {
  type: string;
  count: number;
}

interface CardStat311Props {
  data: RequestItem[];
  total: number;
  seriousTypes?: Set<string>;
}

export default function CardStat311({ data, total, seriousTypes }: CardStat311Props) {
  return (
    <div className="mx-auto md:w-[400px]">
      <div className="rounded-xl bg-[#F5ECD8] border border-[#7B8DC5]/20 backdrop-blur-md p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">311 Service Requests</p>
          <p className="text-sm text-gray-600 mt-0.5">
            Total <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> requests in 2026
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {data.map((item) => {
            const isSerious = seriousTypes?.has(item.type) && item.count > 0;
            return (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className={`relative overflow-hidden min-w-12 rounded-md px-2 py-1 text-center text-xs ${
                    isSerious
                      ? "border border-red-400/70 text-red-600 font-semibold"
                      : "bg-white/20 text-gray-700"
                  }`}
                >
                  {isSerious && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at bottom left, rgba(248,113,113,0.2) 0%, transparent 70%)",
                      }}
                    />
                  )}
                  <span className="relative">{item.count.toLocaleString()}</span>
                </div>
                <span
                  className={`text-sm truncate ${
                    isSerious
                      ? "bg-transparent text-red-600 font-medium rounded px-1.5 py-0.5"
                      : "text-gray-800"
                  }`}
                  title={item.type}
                >
                  {item.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
