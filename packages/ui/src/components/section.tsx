import { cn } from "@workspace/ui/lib/utils";

type Props = React.ComponentPropsWithoutRef<"section"> & {
  containerClasseName?: string;
};

export const Section = ({
  children,
  className,
  containerClasseName,
  ...props
}: Props) => {
  return (
    <section className={cn("w-full py-16 md:py-32", className)} {...props}>
      <div
        className={cn(
          "container flex h-full flex-col items-center",
          containerClasseName,
        )}
      >
        {children}
      </div>
    </section>
  );
};
