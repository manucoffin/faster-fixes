// Retired: `planAwareProcedure` resolved a Plan into `ctx.plan` that nothing
// read, then `enforceLimit` and `enforceFeature` resolved it again. Each of the
// two middlewares now resolves the Organization it checks and nothing else.
// Nothing imports this module; it is kept as an empty stub for the maintainer
// to delete.
