import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COLORS = [
  "bg-[#3A5AA5]",
  "bg-[#5A73B5]",
  "bg-[#7B8DC5]",
  "bg-[#A2A9D4]",
  "bg-[#4A66AE]",
  "bg-[#6980BE]",
];

interface PropertyMixProps {
  data: Record<string, number>;
  total: number;
}

export default function CardStatPropertyMix({ data, total }: PropertyMixProps) {
  const entries = Object.entries(data).map(([name, count], i) => ({
    id: name,
    name,
    count,
    pct: total > 0 ? (count / total) * 100 : 0,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="mx-auto md:w-[400px]">
      <div className="rounded-xl bg-[#F5ECD8] border border-[#7B8DC5]/20 backdrop-blur-md p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Property Mix</p>
          <p className="text-sm text-gray-600 mt-0.5">
            <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> total properties
          </p>
        </div>
        <div>
          <TooltipProvider>
            <div className="mb-6 flex h-4 w-full overflow-hidden rounded-full">
              {entries.map((entry) => (
                <Tooltip key={entry.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`${entry.color} h-full`}
                      style={{ width: `${entry.pct}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="mb-1 text-sm font-medium">{entry.name}</div>
                    <div className="text-xs opacity-80">
                      {entry.count.toLocaleString()} · {Math.round(entry.pct)}%
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4">
                <div className={`h-3 w-3 rounded-full ${entry.color}`} />
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {entry.count.toLocaleString()} properties
                    </p>
                  </div>
                  <div className="flex w-24 items-center gap-2">
                    <Progress
                      value={entry.pct}
                      className="h-2"
                      indicatorColor={entry.color}
                    />
                    <span className="text-muted-foreground w-10 text-right text-xs">
                      {Math.round(entry.pct)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
