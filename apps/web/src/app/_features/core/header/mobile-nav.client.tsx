"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type NavLink = { href: string; label: string };
type IntegrationLink = { href: string; label: string; description: string };

export function MobileNav({
  links,
  integrationLinks,
}: {
  links: NavLink[];
  integrationLinks?: IntegrationLink[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              className="text-foreground hover:bg-accent rounded-md px-3 py-2 text-sm transition-colors"
              onClick={close}
            >
              {link.label}
            </Link>
          ))}

          {integrationLinks && integrationLinks.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold tracking-wider uppercase">
                Integrations
              </p>
              {integrationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as never}
                  className="text-foreground hover:bg-accent rounded-md px-3 py-2 text-sm transition-colors"
                  onClick={close}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
