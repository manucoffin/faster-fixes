// PROTOTYPE, throwaway. Stands in for the rrweb replay frame: a fake shop
// page that changes with the clock, so seeking shows something move.
import { cn } from "@workspace/ui/lib/utils";
import { ENTRIES, isInGap } from "./data";

type FakePageProps = { time: number; className?: string };

export function FakePage({ time, className }: FakePageProps) {
  const click = ENTRIES.find(
    (entry) =>
      entry.kind === "step" &&
      entry.x !== undefined &&
      time >= entry.time &&
      time < entry.time + 700,
  );
  const isNarrow = time >= 81_000;

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-muted/30 p-6 text-left",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-[16/10] max-h-full overflow-hidden rounded-md border bg-white text-[13px] text-foreground transition-[max-width] duration-300",
          isNarrow ? "aspect-[9/14] h-full" : "w-full max-w-3xl",
        )}
      >
        <Scene time={time} isNarrow={isNarrow} />
        {click?.kind === "step" && (
          <span
            className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 border-sky-500"
            style={{
              left: `${String(click.x)}%`,
              top: `${String(click.y)}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

type ShopHeaderProps = { path: string };

function ShopHeader({ path }: ShopHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3">
      <span className="font-semibold">Northwind Supply</span>
      <span className="font-mono text-[11px] text-muted-foreground">
        {path}
      </span>
    </div>
  );
}

type CartProps = { time: number };

function Cart({ time }: CartProps) {
  const quantity = 1 + Number(time >= 1500) + Number(time >= 7000);
  return (
    <div className="flex size-full flex-col">
      <ShopHeader path="/cart" />
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <span className="text-base font-semibold">Your cart</span>
        <Row label="Canvas tote" detail="1" price="24.00" />
        <Row label="Enamel mug" detail={String(quantity)} price="14.00" />
        <div className="flex items-center gap-2">
          <span className="w-40 rounded border border-border px-2 py-1 text-muted-foreground">
            {time >= 25_000 ? "••••••••" : "Promo code"}
          </span>
          <span className="rounded bg-muted px-2 py-1">Apply</span>
          {time >= 27_900 && (
            <span className="text-destructive">Invalid code.</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <span>
            Total <span className="font-semibold">EUR 38.00</span>
          </span>
          <span className="rounded bg-foreground px-3 py-1.5 text-background">
            Checkout
          </span>
        </div>
      </div>
    </div>
  );
}

type RowProps = {
  label: string;
  detail: string;
  price: string;
};

function Row({ label, detail, price }: RowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-2">
      <span className="size-8 rounded bg-muted" />
      <span className="flex-1">{label}</span>
      <span className="rounded border border-border px-2 tabular-nums">
        − {detail} +
      </span>
      <span className="w-14 text-right tabular-nums">{price}</span>
    </div>
  );
}

type CheckoutProps = { time: number; isNarrow: boolean };

function Checkout({ time, isNarrow }: CheckoutProps) {
  const hasDelivery = time >= 53_740;
  return (
    <div className="flex size-full flex-col">
      <ShopHeader path="/checkout" />
      <div className="relative flex flex-1 gap-5 px-5 py-4">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-base font-semibold">Delivery</span>
          {hasDelivery ? (
            <>
              <span className="rounded border border-border px-2 py-1">
                Standard, 3 to 5 days
              </span>
              <span className="rounded border border-border px-2 py-1">
                Express, next day
              </span>
            </>
          ) : (
            <>
              <span className="h-7 animate-pulse rounded bg-muted" />
              <span className="h-7 animate-pulse rounded bg-muted" />
            </>
          )}
          <span className="mt-2 font-semibold">Address</span>
          <span className="h-7 rounded border border-border" />
          <span className="h-7 rounded border border-border" />
          <span className="mt-auto w-fit rounded bg-foreground px-3 py-1.5 text-background">
            Pay
          </span>
        </div>
        <div
          className={cn(
            "flex h-fit w-44 flex-col gap-1 rounded border border-border bg-muted/50 p-3",
            isNarrow && "absolute top-24 right-3 left-3 w-auto shadow-md",
          )}
        >
          <span className="font-semibold">Order summary</span>
          <span>2 items</span>
          <span>EUR 38.00</span>
        </div>
      </div>
    </div>
  );
}

type SceneProps = { time: number; isNarrow: boolean };

function Scene({ time, isNarrow }: SceneProps) {
  if (isInGap(time)) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
        <span className="font-medium text-foreground">Page load</span>
        <span className="text-xs">
          1.6 s not recorded. The recording resumes on /checkout.
        </span>
      </div>
    );
  }
  if (time < 41_000) {
    return <Cart time={time} />;
  }
  return <Checkout time={time} isNarrow={isNarrow} />;
}
