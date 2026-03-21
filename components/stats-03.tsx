interface CrimeItem {
  offense: string;
  count: number;
}

interface Stats03Props {
  data: CrimeItem[];
}

export default function Stats03({ data }: Stats03Props) {
  return (
    <div className="flex items-center justify-center w-full">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {data.map((item) => (
          <div key={item.offense} className="rounded-xl bg-verdict/40 border border-[#016B51]/20 backdrop-blur-md p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.offense}</dt>
            <dd className="mt-2 flex items-baseline space-x-2.5">
              <span className="tabular-nums text-3xl font-semibold text-gray-900">
                {item.count.toLocaleString()}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
