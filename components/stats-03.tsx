import { Card, CardContent } from "@/components/ui/card";

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
          <Card key={item.offense} className="p-6 py-4 shadow-2xs">
            <CardContent className="p-0">
              <dt className="text-sm font-medium text-muted-foreground">{item.offense}</dt>
              <dd className="mt-2 flex items-baseline space-x-2.5">
                <span className="tabular-nums text-3xl font-semibold text-foreground">
                  {item.count.toLocaleString()}
                </span>
                {/* TODO: implement change for crime safety */}
              </dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </div>
  );
}
