import { isCloud } from "@/utils/environment/env";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { ComponentProps } from "react";

const EXTERNAL_SITE_URL = "https://faster-fixes.com";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
  iconClassName?: string;
};

export const AppLogo = ({ className, ...props }: Props) => {
  const sharedClassName = cn(
    "dark:hover:text-primary-foreground hover:text-foreground font-medium transition-colors",
    className,
  );

  if (!isCloud()) {
    return (
      <a href={EXTERNAL_SITE_URL} target="_blank" rel="noopener noreferrer" className={sharedClassName}>
        /fasterfixes
      </a>
    );
  }

  return (
    <Link href="/" className={sharedClassName} {...props}>
      /fasterfixes
    </Link>
  );
};

type AppLogoMarkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
};

export const AppLogoMark = ({ className, ...props }: AppLogoMarkProps) => {
  const sharedClassName = cn(
    "dark:hover:text-primary-foreground hover:text-foreground font-medium transition-colors",
    className,
  );

  if (!isCloud()) {
    return (
      <a href={EXTERNAL_SITE_URL} target="_blank" rel="noopener noreferrer" className={sharedClassName}>
        /ff
      </a>
    );
  }

  return (
    <Link href="/" className={sharedClassName} {...props}>
      /ff
    </Link>
  );
};
