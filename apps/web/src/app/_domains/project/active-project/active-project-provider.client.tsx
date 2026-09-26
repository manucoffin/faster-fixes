"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

/**
 * The shape `matchQueryStatus` reads, so that a consumer renders the failure of
 * the Project list itself rather than an empty list standing in for it.
 *
 * `isLoading` follows the query's `isPending`: the read waits for the active
 * Organization, and while it is idle the shell is still loading.
 */
export type ProjectsQueryState = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: Project[] | undefined;
};

type ActiveProjectContextType = {
  activeProject: Project | null;
  projects: Project[];
  isPending: boolean;
  projectsQuery: ProjectsQueryState;
  setActiveProject: (projectId: string) => void;
  clearActiveProject: () => void;
};

const ActiveProjectContext = createContext<
  ActiveProjectContextType | undefined
>(undefined);

type ActiveProjectProviderProps = {
  children: ReactNode;
};

export function ActiveProjectProvider({
  children,
}: ActiveProjectProviderProps) {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    () => getActiveProjectId() ?? null,
  );
  const prevOrgIdRef = useRef<string | undefined>(activeOrg?.id);

  const projectsQuery = useQuery(
    trpc.authenticated.projects.list.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    ),
  );

  const { data: projects, isPending } = projectsQuery;

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
    const firstProject = projects?.[0];
    if (!isPending && !validatedProject && firstProject) {
      setCookie(firstProject.id);
      setActiveProjectIdState(firstProject.id);
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
        projectsQuery: {
          isLoading: isPending,
          isError: projectsQuery.isError,
          error: projectsQuery.error,
          data: projects,
        },
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
