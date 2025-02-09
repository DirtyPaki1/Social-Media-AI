import { Suspense } from "react";
import SavedPosts from "../components/SavedPosts";
import SavedPostsSkeleton from "../components/SavedPostsSkeleton";

async function Page() {
  return (
    <div className="pt-12">
      <h2 className="text-center mx-auto font-semibold text-2xl mb-4">
        Saved posts
      </h2>
      <Suspense fallback={<SavedPostsSkeleton />}>
        <SavedPosts />;
      </Suspense>
    </div>
  );
}

export default Page;
