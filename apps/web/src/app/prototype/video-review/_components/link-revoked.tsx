import { AppLogo } from "@/app/_components/app-logo";

export function LinkRevoked() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4">
      <header className="mx-auto flex w-full max-w-xl justify-center py-6">
        <AppLogo className="text-lg" />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center pb-16">
        <div className="space-y-3 text-center">
          <h1 className="text-2xl leading-snug font-semibold">
            This link no longer works
          </h1>
          <p className="text-lg text-muted-foreground">
            The team replaced the share link for this video. Ask them for the
            new one.
          </p>
        </div>
      </main>
    </div>
  );
}
