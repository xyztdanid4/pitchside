/**
 * Validates the import graph of `src/`. Each rule describes a dependency that is
 * not allowed; `pnpm depcruise` fails if any import breaks one.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
export default {
  forbidden: [
    {
      // Circular imports make module initialisation order unpredictable (values can
      // be `undefined` at import time) and mean the modules can't be understood or
      // tested in isolation.
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      // A module that nothing imports and that imports nothing is dead code.
      // Entry points and files loaded by tools rather than by imports are exempt.
      name: 'no-orphans',
      severity: 'error',
      from: {
        orphan: true,
        pathNot: [String.raw`^src/main\.tsx$`, String.raw`^src/test/setup\.ts$`],
      },
      to: {},
    },
    {
      // Every import must resolve to a file or an installed package. Catches typos
      // and imports of files that were moved or deleted.
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      // Packages must be declared in package.json. An undeclared package only works
      // by accident, because something else happened to install it.
      name: 'no-non-package-json',
      severity: 'error',
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },
    {
      // Application code may only use runtime dependencies. A devDependency (test or
      // build tooling) imported at runtime would be missing in a production install.
      // Type-only imports are fine, they are erased at build time.
      name: 'not-to-dev-dep',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: [String.raw`\.test\.tsx?$`, '^src/test/'],
      },
      to: {
        dependencyTypes: ['npm-dev'],
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      // Application code must not import tests or test helpers; they would end up
      // in the production bundle together with their test-only dependencies.
      name: 'not-to-test',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: [String.raw`\.test\.tsx?$`, '^src/test/'],
      },
      to: {
        path: [String.raw`\.test\.tsx?$`, '^src/test/'],
      },
    },
  ],

  options: {
    // Report imports of packages, but don't analyse the packages' own internals
    doNotFollow: { path: 'node_modules' },
    // Use the app tsconfig so the `@/` alias resolves like it does in the build
    tsConfig: { fileName: 'tsconfig.app.json' },
    // Include type-only imports in the graph, so `not-to-dev-dep` can tell them apart
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
}
