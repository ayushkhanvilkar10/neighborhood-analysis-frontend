import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle>311 Service Requests</CardTitle>
          <CardDescription>
            Total <span className="font-semibold text-foreground">{total.toLocaleString()}</span> requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {data.map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div className="bg-muted min-w-12 rounded-md px-2 py-1 text-center text-xs">
                  {item.count.toLocaleString()}
                </div>
                <span className="text-sm truncate" title={item.type}>{item.type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
