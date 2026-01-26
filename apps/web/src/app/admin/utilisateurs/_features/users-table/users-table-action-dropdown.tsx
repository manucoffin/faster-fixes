"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Copy, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";

type UsersTableActionDropdownProps = {
  userId: string;
};

export const UsersTableActionDropdown = ({
  userId,
}: UsersTableActionDropdownProps) => {


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(userId)}
        >
          <Copy className="mr-2 w-4" />
          Copier l&apos;ID de l&apos;utilisateur
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/utilisateurs/${userId}`}>
            <Eye className="mr-2 w-4" /> Voir les détails
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
