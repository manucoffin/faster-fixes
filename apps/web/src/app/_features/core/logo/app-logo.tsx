import LogoImage from "@public/static/app-logo.png";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
  iconClassName?: string;
};

export const AppLogo = ({ className, ...props }: Props) => {
  return (
    <Link href="/" className={cn("", className)} {...props}>
      <Image
        src={LogoImage}
        alt="App logo"
        width={128}
        height={40}
        priority
      />
    </Link>
  );
};
