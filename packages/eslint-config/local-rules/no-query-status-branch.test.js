import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noQueryStatusBranchRule } from "./no-query-status-branch.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const FEATURE =
  "/repo/apps/web/src/app/(authenticated)/(project)/reviewers/_features/reviewers-tab.client.tsx";

ruleTester.run("no-query-status-branch", noQueryStatusBranchRule, {
  valid: [
    {
      name: "the query is rendered through matchQueryStatus",
      filename: FEATURE,
      code: `export function ReviewersTab() { const reviewersQuery = useQuery(trpc.reviewer.list.queryOptions()); return matchQueryStatus(reviewersQuery, { Loading: <Skeleton />, Errored: <Empty />, Empty: <Empty />, Success: ({ data }) => <List data={data} /> }); }\n`,
    },
    {
      name: "a mutation's isPending on a submit button",
      filename: FEATURE,
      code: `export function CreateReviewer() { const createReviewer = useMutation(trpc.reviewer.create.mutationOptions()); return <Button disabled={createReviewer.isPending} />; }\n`,
    },
    {
      name: "an isLoading prop of the component itself",
      filename: FEATURE,
      code: `export function Picker({ isLoading }) { if (isLoading) return null; return <ul />; }\n`,
    },
    {
      name: "isPending from a hook that is not a query",
      filename: FEATURE,
      code: `export function UserMenu() { const { data: session, isPending } = useSession(); return isPending ? null : <p>{session.user.name}</p>; }\n`,
    },
    {
      name: "a status field of the data, not of the query",
      filename: FEATURE,
      code: `export function Badge() { const feedbackQuery = useQuery(options); return matchQueryStatus(feedbackQuery, { Loading: <Skeleton />, Errored: <Empty />, Empty: <Empty />, Success: ({ data }) => <span>{data.status}</span> }); }\n`,
    },
    {
      name: "a background refetch flag",
      filename: FEATURE,
      code: `export function Archive() { const archiveQuery = useQuery(options); return <DataTable isLoading={archiveQuery.isFetching} />; }\n`,
    },
    {
      name: "a hook in a .ts file may derive a status",
      filename:
        "/repo/apps/web/src/app/_domains/project/active-project/use-projects.ts",
      code: `export function useProjects() { const query = useQuery(options); return { busy: query.isPending }; }\n`,
    },
  ],
  invalid: [
    {
      name: "an early return on query.isLoading",
      filename: FEATURE,
      code: `export function Title() { const query = useQuery(options); if (query.isLoading) return <Skeleton />; return <h1>{query.data.title}</h1>; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "isLoading" } }],
    },
    {
      name: "isLoading and isError destructured from useQuery",
      filename: FEATURE,
      code: `export function UsersTable() { const { data, isLoading, isError } = useQuery(options); return <DataTable data={data} isLoading={isLoading} isError={isError} />; }\n`,
      errors: [
        { messageId: "statusBranch", data: { flag: "isLoading" } },
        { messageId: "statusBranch", data: { flag: "isError" } },
      ],
    },
    {
      name: "isPending, the v5 loading flag, on a *Query variable",
      filename: FEATURE,
      code: `export function Switcher() { const projectsQuery = useQuery(options); return projectsQuery.isPending ? <Skeleton /> : <Select />; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "isPending" } }],
    },
    {
      name: "a negated isError in a derived boolean",
      filename: FEATURE,
      code: `export function Members() { const canInvite = isAdmin && !invitationsQuery.isError; return canInvite ? <Button /> : null; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "isError" } }],
    },
    {
      name: "a comparison on status",
      filename: FEATURE,
      code: `export function Card() { const query = useQuery(options); return query.status === "error" ? <Empty /> : <p />; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "status" } }],
    },
    {
      name: "a variable assigned from a query hook, whatever its name",
      filename: FEATURE,
      code: `export function Card() { if (pets.isSuccess) return <List />; const pets = useInfiniteQuery(options); return null; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "isSuccess" } }],
    },
    {
      name: "a status flag read through an optional chain",
      filename: FEATURE,
      code: `export function Card({ planQuery }) { return planQuery?.isLoading ? <Skeleton /> : <p />; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "isLoading" } }],
    },
    {
      name: "a status flag destructured from a query variable",
      filename: FEATURE,
      code: `export function Provider() { const projectsQuery = useQuery(options); const { data, isPending } = projectsQuery; return isPending ? null : <p />; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "isPending" } }],
    },
    {
      name: "a status flag read straight off the hook call",
      filename: FEATURE,
      code: `export function Card() { return trpc.plan.get.useQuery().isError ? <Empty /> : <p />; }\n`,
      errors: [{ messageId: "statusBranch", data: { flag: "isError" } }],
    },
  ],
});
