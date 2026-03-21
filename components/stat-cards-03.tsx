interface RequestItem {
  type: string;
  count: number;
}

interface CardStat311Props {
  data: RequestItem[];
  total: number;
}

export default function CardStat311({ data, total }: CardStat311Props) {
  return (
    <div className="mx-auto md:w-[400px]">
      <div className="rounded-xl bg-verdict/40 border border-[#016B51]/20 backdrop-blur-md p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">311 Service Requests</p>
          <p className="text-sm text-gray-600 mt-0.5">
            Total <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> requests
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {data.map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <div className="bg-white/20 min-w-12 rounded-md px-2 py-1 text-center text-xs text-gray-700">
                {item.count.toLocaleString()}
              </div>
              <span className="text-sm truncate text-gray-800" title={item.type}>{item.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
