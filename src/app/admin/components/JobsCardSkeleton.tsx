import { Card } from "@/components/ui/card";

export default function JobCardSkeleton() {
  return (
    <Card className="bg-white shadow-md border border-gray-100 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="flex gap-2">
          <div className="h-9 bg-gray-200 rounded w-28"></div>
          <div className="h-9 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </Card>
  );
}
