import { AppLogo } from "@/app/_components/app-logo";
import { PublicMessage } from "@/app/_components/public-message";

export function ReviewLinkNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4">
      <header className="mx-auto flex w-full max-w-xl justify-center py-6">
        <AppLogo className="text-lg" />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center pb-16">
        <PublicMessage
          title="This link no longer works"
          description="The share link for this video was replaced, or the video was removed."
        >
          <p className="text-center text-muted-foreground">
            Ask the person who shared it with you for a new link.
          </p>
        </PublicMessage>
      </main>
    </div>
  );
}
