import type { MDXComponents } from "mdx/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    table: (props) => <Table {...props} />,
    thead: (props) => <TableHeader {...props} />,
    tbody: (props) => <TableBody {...props} />,
    tr: (props) => <TableRow {...props} />,
    th: (props) => <TableHead {...props} />,
    td: (props) => <TableCell {...props} />,
    ...components,
  };
}
