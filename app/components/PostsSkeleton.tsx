import { Skeleton } from "@/components/ui/skeleton";

function PostsSkeleton() {
  return (
    <div className="w-full mx-auto grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3 p-6">
      <Skeleton className="h-[65vh]" />
      <Skeleton className="h-[65vh]" />
      <Skeleton className="h-[65vh] sm:h-0 lg:h-[65vh]" />
    </div>
  );
}

export default PostsSkeleton;
