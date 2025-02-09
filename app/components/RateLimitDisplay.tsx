interface RateLimitDisplayProps {
  remaining: number | null;
  limit: number | null;
}

export default function RateLimitDisplay({
  remaining,
  limit,
}: RateLimitDisplayProps) {
  if (remaining === null || limit === null) return null;

  return (
    <div className="text-secondary-foreground text-sm mt-4 text-center">
      {remaining} / {limit} generations remaining today
    </div>
  );
}
