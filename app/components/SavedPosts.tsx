import { getSavedPosts } from "../_lib/data-services";
import SavedPostsFeed from "./SavedPostsFeed";

async function SavedPosts() {
  const savedPosts = await getSavedPosts();

  return (
    <div className="px-4">
      <SavedPostsFeed savedPosts={savedPosts} />
    </div>
  );
}

export default SavedPosts;
