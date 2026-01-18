type PageParams<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

type LayoutParams = Readonly<{
  children: React.ReactNode;
}>;

export type { LayoutParams, PageParams };
