"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState } from "react";

export type BreadcrumbItem = {
  label: string;
  link?: string;
};

type BreadcrumbContextType = {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined,
);

type BreadcrumbProviderProps = {
  children: ReactNode;
};

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
  }
  return context;
}

// Helper hook to set breadcrumbs
export function useSetBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const breadcrumbsString = JSON.stringify(breadcrumbs);

  // Set breadcrumbs on component mount
  React.useEffect(() => {
    setBreadcrumbs(breadcrumbs);

    // Clean up breadcrumbs when component unmounts
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, breadcrumbs, breadcrumbsString]);
}
