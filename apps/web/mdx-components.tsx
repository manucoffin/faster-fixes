import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents) {
  return {
    // table: (props) => <Table {...props} />,
    thead: (props) => <TableHeader {...props} />,
    tbody: (props) => <TableBody {...props} />,
    tr: (props) => <TableRow {...props} />,
    th: (props) => <TableHead {...props} />,
    td: (props) => <TableCell {...props} />,
    ...defaultMdxComponents,
    ...components,
  } satisfies MDXComponents;
}

// export function useMDXComponents(components: MDXComponents): MDXComponents {
//   return {
//     table: (props) => <Table {...props} />,
//     thead: (props) => <TableHeader {...props} />,
//     tbody: (props) => <TableBody {...props} />,
//     tr: (props) => <TableRow {...props} />,
//     th: (props) => <TableHead {...props} />,
//     td: (props) => <TableCell {...props} />,
//     ...components,
//   };
// }

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
