# Canonical example: the `listing` domain

> One complete domain in the target shape. Derived from a real mid-sized domain, renamed to a neutral entity and trimmed of project-specific dependencies so every file compiles against the architecture alone. Read it alongside `../target-architecture.md`.

A **Listing** is a post an authenticated user publishes so that professionals can respond. It has a title, a description, a category (a Prisma enum), an optional address, and a remote flag. The example covers every bucket plus the barrel and the router.

## Tree

```
src/app/_domains/listing/
├── index.ts                                          # public barrel
├── trpc-router.ts                                    # thin transport, scope root
├── _components/
│   └── listing-cover-placeholder.tsx                 # pure UI, no logic
├── _features/
│   ├── create-listing/
│   │   └── create-listing-dialog.client.tsx          # capability: publish a listing
│   ├── listing-form/
│   │   └── listing-form.client.tsx                   # shared form UI, used by create and edit
│   └── search/
│       └── search-listings-button.client.tsx         # capability: jump to the catalogue with filters
├── _helpers/
│   ├── generate-listing-slug.ts                      # pure
│   ├── sanitise-listing-content.ts                   # pure
│   └── search-params.ts                              # nuqs parsers (pure)
├── _services/
│   ├── create-listing.ts                             # write
│   ├── anonymise-listing.ts                          # write, dependency-injected
│   ├── get-recent-listing-counts.ts                  # read
│   └── create-listing.schema.ts                      # pure Zod
└── _types/
    └── listing-map-types.ts                          # standalone shared types
```

Files are named after their export. The domain name `listing` matches the glossary term. `_components/` is flat. Nothing under `_features/` contains data access.

## `_services/create-listing.schema.ts`

Pure Zod. Imports a generated Prisma enum (allowed) and a schema exported by another domain's barrel (allowed). Exports `XSchema`, `XInput`, and `XValues` because a nested default makes input and output diverge.

```ts
import { AddressSchema } from "@/app/_domains/geo";
import { ListingCategory } from "@repo/db/generated/prisma/enums";
import { z } from "zod";

export const CreateListingSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(8, "Give a title of at least 8 characters.")
      .max(100),
    description: z
      .string()
      .trim()
      .min(30, "Describe your situation in at least 30 characters.")
      .max(2000),
    category: z.enum(ListingCategory),
    isRemote: z.boolean(),
    address: AddressSchema.nullable(),
  })
  .refine((data) => data.isRemote || data.address !== null, {
    message: "Provide a location or mark the listing as remote.",
    path: ["address"],
  });

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

// Pre-parse shape of the form: defaulted address fields are optional on the
// way in and guaranteed on the way out (`CreateListingInput`).
export type CreateListingValues = z.input<typeof CreateListingSchema>;
```

## `_services/create-listing.ts`

A write. Talks to Prisma directly, calls pure helpers, throws a `DomainError` for an expected failure, returns a plain object. Never imports tRPC.

```ts
import { generateListingSlug } from "@/app/_domains/listing/_helpers/generate-listing-slug";
import { sanitiseListingContent } from "@/app/_domains/listing/_helpers/sanitise-listing-content";
import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@repo/db";
import type { CreateListingInput } from "./create-listing.schema";

export async function createListing(userId: string, input: CreateListingInput) {
  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!author) {
    throw new NotFoundError("Account not found.");
  }

  const title = sanitiseListingContent(input.title);
  const description = sanitiseListingContent(input.description);
  const slug = generateListingSlug(title);

  const created = await prisma.$transaction(async (tx) => {
    let addressId: string | null = null;
    if (input.address) {
      const address = await tx.address.create({
        data: { ...input.address, userId },
        select: { id: true },
      });
      addressId = address.id;
    }

    return tx.listing.create({
      data: {
        authorId: userId,
        title,
        slug,
        description,
        category: input.category,
        isRemote: input.isRemote,
        addressId,
      },
      select: { id: true, slug: true },
    });
  });

  return { id: created.id, slug: created.slug };
}
```

If the project uses cache tags, the write ends with `revalidateCacheTags(cacheTags.public.listings.cataloguePage)` before the `return`.

## `_services/get-recent-listing-counts.ts`

A read. Exports its return type as the type source of truth.

```ts
import { prisma } from "@repo/db";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

// Feeds the posting rate limit enforced by the create procedure.
export async function getRecentListingCounts(userId: string) {
  const now = new Date();

  const [postsLast24h, postsLast30d] = await Promise.all([
    prisma.listing.count({
      where: {
        authorId: userId,
        createdAt: { gte: new Date(now.getTime() - ONE_DAY_MS) },
      },
    }),
    prisma.listing.count({
      where: {
        authorId: userId,
        createdAt: { gte: new Date(now.getTime() - THIRTY_DAYS_MS) },
      },
    }),
  ]);

  return { postsLast24h, postsLast30d };
}

export type GetRecentListingCounts = Awaited<
  ReturnType<typeof getRecentListingCounts>
>;
```

## `_services/anonymise-listing.ts`

A write with a precise domain verb (`anonymise`, a distinct transition, not `update`). Receives `prisma` as a trailing parameter with a default, so a test can pass a fake.

```ts
import { prisma as defaultPrisma } from "@repo/db";
import type { PrismaClient } from "@repo/db/generated/prisma/client";
import { ListingStatus } from "@repo/db/generated/prisma/enums";

type AnonymiseListingOptions = {
  // When true, also moves Open/Closed listings to Removed (account deletion).
  // When false, status is unchanged (the scheduled post-close scrub).
  forceRemoved?: boolean;
};

export async function anonymiseListing(
  listingId: string,
  options: AnonymiseListingOptions = {},
  prisma: PrismaClient = defaultPrisma,
) {
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      title: "Deleted listing",
      description: "",
      addressId: null,
      isAnonymised: true,
      ...(options.forceRemoved ? { status: ListingStatus.Removed } : {}),
    },
  });
}
```

## `_helpers/generate-listing-slug.ts`

Pure. No IO.

```ts
import { nanoid } from "nanoid";
import slugify from "slugify";

// `slugify(title)-nanoid(6)`: the suffix avoids collisions on near-identical
// titles without a uniqueness lookup. Set on creation, never regenerated.
export function generateListingSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true }) || "listing";
  return `${base}-${nanoid(6).toLowerCase()}`;
}
```

## `_helpers/sanitise-listing-content.ts`

Pure. Called by write services before persistence.

```ts
const PLACEHOLDER = "[hidden]";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /(?:https?:\/\/|www\.)\S+/gi;
// Applied last so digits inside emails and URLs are already replaced.
const PHONE_RE = /\+?\d[\d\s.()-]{7,}\d/g;

export function sanitiseListingContent(input: string): string {
  if (!input) return input;
  return input
    .replace(EMAIL_RE, PLACEHOLDER)
    .replace(URL_RE, PLACEHOLDER)
    .replace(PHONE_RE, PLACEHOLDER);
}
```

## `_helpers/search-params.ts`

nuqs parsers are pure and belong to helpers. They are a contract other domains and routes compose, so the barrel exports them.

```ts
import {
  createLoader,
  createSearchParamsCache,
  inferParserType,
  parseAsString,
} from "nuqs/server";

export const listingsSearchParsers = {
  category: parseAsString,
  cityCode: parseAsString,
  locationQuery: parseAsString,
};

export type ListingsSearchParsers = inferParserType<
  typeof listingsSearchParsers
>;

export const listingsSearchParamsCache = createSearchParamsCache(
  listingsSearchParsers,
);
export const loadListingsSearchParams = createLoader(listingsSearchParsers);
```

## `_types/listing-map-types.ts`

Hand-written, isomorphic, no runtime code. A `_types/` file holds types only; a function that computes something from these types is a helper.

```ts
export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type ListingMapPin = {
  listingId: string;
  latitude: number;
  longitude: number;
  isApproximate: boolean;
};
```

## `_components/listing-cover-placeholder.tsx`

Pure UI, no schema, no server, no state. Flat in `_components/`.

```tsx
import CoverPlaceholder from "@public/images/common/listing-cover-placeholder.png";

// Tiled pattern filling the cover frame when a listing has no photo.
// Expects a positioned parent.
export function ListingCoverPlaceholder() {
  return (
    <div
      className="absolute inset-0 bg-repeat"
      style={{
        backgroundImage: `url(${CoverPlaceholder.src})`,
        backgroundSize: "auto 100%",
      }}
    />
  );
}
```

## `_features/listing-form/listing-form.client.tsx`

A client feature. Imports the schema from `_services/` (the sanctioned exception), never a service function. Uses `react-hook-form` with `zodResolver`, typed with both `Values` and `Input`.

```tsx
"use client";

import { ActionButton } from "@repo/ui/components/action-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { AddressCombobox } from "@/app/_domains/geo";
import { zodResolver } from "@hookform/resolvers/zod";
import { ListingCategory } from "@repo/db/generated/prisma/enums";
import { useForm } from "react-hook-form";
import {
  CreateListingSchema,
  type CreateListingInput,
  type CreateListingValues,
} from "../../_services/create-listing.schema";

export type ListingFormProps = {
  defaultValues?: Partial<CreateListingInput>;
  onSubmit: (data: CreateListingInput) => void;
  isPending?: boolean;
  submitLabel?: string;
};

export function ListingForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = "Publish",
}: ListingFormProps) {
  const form = useForm<CreateListingValues, unknown, CreateListingInput>({
    resolver: zodResolver(CreateListingSchema),
    defaultValues: {
      title: "",
      description: "",
      category: ListingCategory.Other,
      isRemote: false,
      address: null,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title of your listing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your situation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <AddressCombobox
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ActionButton type="submit" pending={isPending}>
          {submitLabel}
        </ActionButton>
      </form>
    </Form>
  );
}
```

## `_features/create-listing/create-listing-dialog.client.tsx`

The capability that owns the mutation. Errors from the mutation are toasted (the mutation channel). The message is already user-safe: it is either a `DomainError` message or the masked generic copy.

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { trpc } from "@/lib/trpc/trpc-client";
import { toast } from "sonner";
import { ListingForm } from "../listing-form/listing-form.client";

type CreateListingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CreateListingDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateListingDialogProps) {
  const utils = trpc.useUtils();

  const createMutation = trpc.listings.create.useMutation({
    onSuccess: async () => {
      toast.success("Listing published");
      await utils.authenticated.myListings.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish a listing</DialogTitle>
        </DialogHeader>
        <ListingForm
          onSubmit={(values) => createMutation.mutate(values)}
          isPending={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
```

## `_features/search/search-listings-button.client.tsx`

A small capability that composes a helper from its own domain via a relative path.

```tsx
"use client";

import { Button } from "@repo/ui/components/button";
import { Search } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { listingsSearchParsers } from "../../_helpers/search-params";

export function SearchListingsButton({ onSearch }: { onSearch?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchParams] = useQueryStates(listingsSearchParsers);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.cityCode) params.set("cityCode", searchParams.cityCode);
    if (searchParams.locationQuery)
      params.set("locationQuery", searchParams.locationQuery);
    const query = params.toString();

    if (pathname !== "/listings") {
      router.push(`/listings${query ? `?${query}` : ""}` as Route);
    }
    onSearch?.();
  };

  return (
    <Button onClick={handleSearch} size="lg">
      <Search />
      Search
    </Button>
  );
}
```

## `trpc-router.ts`

Thin transport at the scope root. One procedure: auth, Zod input, a transport-policy guard (rate limit, whose `TOO_MANY_REQUESTS` has no domain-error equivalent), one service call. No try/catch: the base procedure's middleware maps any `DomainError`.

```ts
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { createListing } from "./_services/create-listing";
import { CreateListingSchema } from "./_services/create-listing.schema";
import { getRecentListingCounts } from "./_services/get-recent-listing-counts";

const MAX_PER_DAY = 3;
const MAX_PER_MONTH = 10;

export const listingsRouter = router({
  create: protectedProcedure
    .input(CreateListingSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Posting rate limit is a transport-policy guard (like auth): its 429 code
      // has no DomainError equivalent, so the decision stays in the procedure
      // while the counts come from a read service.
      const { postsLast24h, postsLast30d } =
        await getRecentListingCounts(userId);
      if (postsLast24h >= MAX_PER_DAY) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You reached the limit of 3 listings per day.",
        });
      }
      if (postsLast30d >= MAX_PER_MONTH) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You reached the limit of 10 listings per 30 days.",
        });
      }

      return createListing(userId, input);
    }),
});
```

Mounted in the app router as `listings: listingsRouter`.

## `index.ts`

The barrel exports contracts only: parsers, their type, a UI component. No service, no router.

```ts
export {
  listingsSearchParsers,
  listingsSearchParamsCache,
  loadListingsSearchParams,
} from "./_helpers/search-params";
export type { ListingsSearchParsers } from "./_helpers/search-params";
export { SearchListingsButton } from "./_features/search/search-listings-button.client";
export type { ListingMapPin, MapBounds } from "./_types/listing-map-types";
```

## What a route does with this domain

A route is the composition layer. It may reach into the domain's internals, so a page under `(authenticated)/my-listings/` can import `CreateListingDialog` from `@/app/_domains/listing/_features/create-listing/create-listing-dialog.client` directly. Another **domain** could not: it would have to go through `@/app/_domains/listing`, and `CreateListingDialog` would first need to be exported from the barrel.

A route-scoped read that only this page needs (say `list-my-listings.ts`) lives in `(authenticated)/my-listings/_services/`, with its procedure in `(authenticated)/my-listings/trpc-router.ts`, mounted by `(authenticated)/trpc-router.ts`. It does not go into the domain until a second route needs it.

## Test example

Only pure helpers and injectable services are tested. Colocated, no module mocks.

```ts
// _services/anonymise-listing.test.ts
import { ListingStatus } from "@repo/db/generated/prisma/enums";
import { describe, expect, it, vi } from "vitest";
import { anonymiseListing } from "./anonymise-listing";

describe("anonymiseListing", () => {
  it("forces Removed status when asked", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const fakePrisma = { listing: { update } } as never;

    await anonymiseListing("listing-1", { forceRemoved: true }, fakePrisma);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ListingStatus.Removed }),
      }),
    );
  });
});
```
