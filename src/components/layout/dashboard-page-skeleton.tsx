import { Card, CardContent } from "@/components/ui/card";

export function DashboardPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-stone-200" />
        <div className="h-4 w-72 max-w-full rounded bg-stone-100" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-11 w-11 rounded-xl bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded bg-stone-100" />
                <div className="h-6 w-24 rounded bg-stone-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="h-4 w-full rounded bg-stone-100" />
          <div className="h-4 w-5/6 rounded bg-stone-100" />
          <div className="h-4 w-4/6 rounded bg-stone-100" />
          <div className="h-4 w-3/6 rounded bg-stone-100" />
        </CardContent>
      </Card>
    </div>
  );
}
