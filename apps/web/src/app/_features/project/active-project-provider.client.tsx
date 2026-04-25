"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  clearActiveProjectId,
  getActiveProjectId,
  setActiveProjectId as setCookie,
} from "./active-project-cookie";

type Project = {
  id: string;
  name: string;
  domain: string;
  feedbackCount: number;
};

type ActiveProjectContextType = {
  activeProject: Project | null;
  projects: Project[];
  isPending: boolean;
  setActiveProject: (projectId: string) => void;
  clearActiveProject: () => void;
};

const ActiveProjectContext = createContext<
  ActiveProjectContextType | undefined
>(undefined);

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    () => getActiveProjectId() ?? null,
  );
  const prevOrgIdRef = useRef<string | undefined>(activeOrg?.id);

  const { data: projects, isPending } = useQuery(
    trpc.authenticated.projects.list.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    ),
  );

  // Clear active project when organization changes
  useEffect(() => {
    const prevOrgId = prevOrgIdRef.current;
    prevOrgIdRef.current = activeOrg?.id;

    if (prevOrgId && activeOrg?.id && prevOrgId !== activeOrg.id) {
      setActiveProjectIdState(null);
      clearActiveProjectId();
    }
  }, [activeOrg?.id]);

  // Validate stored project ID against fetched list
  const validatedProject =
    projects?.find((p) => p.id === activeProjectId) ?? null;

  // Auto-select first project when none is active
  useEffect(() => {
    if (!isPending && !validatedProject && projects && projects.length > 0) {
      const firstId = projects[0]!.id;
      setCookie(firstId);
      setActiveProjectIdState(firstId);
    }
  }, [isPending, validatedProject, projects]);

  const setActiveProject = useCallback((projectId: string) => {
    setCookie(projectId);
    setActiveProjectIdState(projectId);
  }, []);

  const clearActiveProjectFn = useCallback(() => {
    clearActiveProjectId();
    setActiveProjectIdState(null);
  }, []);

  return (
    <ActiveProjectContext.Provider
      value={{
        activeProject: validatedProject,
        projects: projects ?? [],
        isPending,
        setActiveProject,
        clearActiveProject: clearActiveProjectFn,
      }}
    >
      {children}
    </ActiveProjectContext.Provider>
  );
}

export function useActiveProject() {
  const context = useContext(ActiveProjectContext);
  if (context === undefined) {
    throw new Error(
      "useActiveProject must be used within an ActiveProjectProvider",
    );
  }
  return context;
}
