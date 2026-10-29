export function TestimonialTooManyRequests() {
  return (
    <div className="space-y-2 pt-10">
      <h1 className="text-2xl font-bold">Too many requests</h1>
      <p className="text-muted-foreground">
        This link has been opened too many times in the last hour. Try again
        later.
      </p>
    </div>
  );
}
