import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COLORS = [
  "bg-[var(--chart-1)]",
  "bg-[var(--chart-2)]",
  "bg-[var(--chart-3)]",
  "bg-[var(--chart-4)]",
  "bg-[var(--chart-5)]",
  "bg-[var(--chart-1)]",
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
      <Card>
        <CardHeader>
          <CardTitle>Property Mix</CardTitle>
          <CardDescription>
            <span className="font-semibold text-foreground">{total.toLocaleString()}</span> total properties
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
