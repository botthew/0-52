import FeedClient from "./feed-client";

export default function FeedPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Feed</h1>
        <p className="text-sm text-muted-foreground">The newest photos from everyone on 0/52.</p>
      </div>
      <FeedClient />
    </div>
  );
}
