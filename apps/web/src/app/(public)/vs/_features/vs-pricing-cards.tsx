import { cn } from "@workspace/ui/lib/utils";

export type VsPricingCard = {
  vendor: string;
  plan: string;
  price: string;
  suffix?: string;
  note: string;
  highlight?: boolean;
};

type VsPricingCardsProps = {
  cards: VsPricingCard[];
};

export function VsPricingCards({ cards }: VsPricingCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {cards.map((card) => (
        <div
          key={card.vendor}
          className={cn(
            "flex flex-col rounded-2xl border bg-background p-6 md:p-7",
            card.highlight && "border-foreground/40",
          )}
        >
          <p className="text-sm font-medium">{card.vendor}</p>
          <p className="mt-1 text-sm text-muted-foreground">{card.plan}</p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {card.price}
            </span>
            {card.suffix && (
              <span className="text-sm text-muted-foreground">
                {card.suffix}
              </span>
            )}
          </div>
          <p className="mt-6 border-t pt-5 text-sm leading-relaxed text-pretty text-muted-foreground">
            {card.note}
          </p>
        </div>
      ))}
    </div>
  );
}
