# Documentation

Internal documentation for working on Faster Fixes. Start from the question you have:

| Question                                                 | Read                                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| What does a domain term mean?                            | [`CONTEXT.md`](../CONTEXT.md), the glossary. Code, docs and issues use its terms.               |
| Why is the code built this way?                          | [`adr/`](adr/README.md), one file per architectural decision, numbered in order.                |
| Who is the product for, and what problem does it solve?  | [`product/project.md`](product/project.md) and [`product/icp.md`](product/icp.md)               |
| How does an internal system work?                        | [`systems/`](systems/), one file per system (today: [asset storage](systems/asset-storage.md)). |
| How do agents use the issue tracker and the domain docs? | [`agents/`](agents/)                                                                            |
| What are the coding conventions?                         | The `coding-standards` skill in `.claude/skills/coding-standards/`.                             |

The documentation published on the website (`/docs`, `/blog`) is not here: it is MDX in `apps/web/src/content/`.
