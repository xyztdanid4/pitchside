import eslintReact from '@eslint-react/eslint-plugin'
import js from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import jestDom from 'eslint-plugin-jest-dom'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import perfectionist from 'eslint-plugin-perfectionist'
import playwright from 'eslint-plugin-playwright'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import testingLibrary from 'eslint-plugin-testing-library'
import unicorn from 'eslint-plugin-unicorn'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', '.lighthouseci']),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      // An `eslint-disable` comment that no longer suppresses anything is an error.
      // Stale suppressions hide the fact that the original problem is gone, and they
      // would silently swallow a new problem on the same line.
      reportUnusedDisableDirectives: 'error',
    },
    plugins: { perfectionist },
    rules: {
      // ---------------------------------------------------------------------------
      // TypeScript
      // ---------------------------------------------------------------------------

      // Object shapes are declared with `type`, never `interface`.
      // `type` can describe objects, unions and mapped types alike, so the codebase
      // uses one construct instead of two. It also avoids interface declaration
      // merging, where two declarations with the same name silently combine.
      //   ✗ interface Team { id: string }
      //   ✓ type Team = { id: string }
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // Imports used only as types must be written as `import type`.
      // Makes it obvious which imports exist at runtime, and type-only imports are
      // guaranteed to be erased from the bundle. Comes with an autofix.
      //   ✗ import { Config } from 'prettier'
      //   ✓ import type { Config } from 'prettier'
      '@typescript-eslint/consistent-type-imports': 'error',

      // Type-only imports use the top-level `import type` form, not inline `type`.
      // With `verbatimModuleSyntax`, `import { type X }` still emits an empty
      // `import 'module'` statement, which runs the module's side effects.
      //   ✗ import { type X } from './x'
      //   ✓ import type { X } from './x'
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // A `switch` over a union type must handle every member (or have a `default`).
      // When a new member is added to the union, every switch that forgot it
      // becomes a lint error instead of a silent fall-through at runtime.
      //   type Status = 'a' | 'b' | 'c'
      //   ✗ switch (status) { case 'a': ...; case 'b': ... }   // 'c' missing
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Conditions must be booleans or nullable objects, not numbers or strings.
      // Truthiness checks on numbers and strings treat `0`, `NaN` and `''` as false,
      // which is a classic source of bugs (e.g. a count of 0 being treated as missing).
      //   ✗ if (count) { ... }          ✓ if (count > 0) { ... }
      //   ✗ if (name) { ... }           ✓ if (name !== '') { ... }
      //   ✓ if (element) { ... }        // nullable object is fine
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        { allowNumber: false, allowString: false },
      ],

      // `.sort()` and `.toSorted()` on non-string arrays need a compare function.
      // Without one, JavaScript converts elements to strings and sorts them
      // lexicographically, so numbers come out in the wrong order.
      //   ✗ [10, 9, 1].sort()                 // -> [1, 10, 9]
      //   ✓ [10, 9, 1].sort((a, b) => a - b)  // -> [1, 9, 10]
      '@typescript-eslint/require-array-sort-compare': 'error',

      // Private class members that are never reassigned after construction must be
      // marked `readonly`, so the compiler enforces what the code already assumes.
      //   ✗ private cache = new Map()
      //   ✓ private readonly cache = new Map()
      '@typescript-eslint/prefer-readonly': 'error',

      // Identifier naming rules, checked per kind of identifier:
      // - default:   camelCase                    (userName, fetchData)
      // - types:     PascalCase                   (Team, MatchStatus)
      // - functions: camelCase or PascalCase      (PascalCase = React component)
      // - variables: camelCase, PascalCase or UPPER_CASE (UPPER_CASE = constant)
      // - params:    camelCase, `_` prefix allowed for intentionally unused ones
      // - quoted object keys are skipped: 'aria-label' or 'Content-Type' are data,
      //   not identifiers
      // Boolean prefixes (`is`, `has`, ...) are checked by
      // `unicorn/consistent-boolean-name` from the unicorn preset, not here.
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'property', modifiers: ['requiresQuotes'], format: null },
      ],

      // ---------------------------------------------------------------------------
      // Core JavaScript
      // ---------------------------------------------------------------------------

      // Only strict equality. `==` converts types before comparing, so
      // `0 == ''`, `null == undefined` and `'1' == 1` are all true.
      //   ✗ if (a == b)
      //   ✓ if (a === b)
      eqeqeq: ['error', 'always'],

      // Type conversions must be explicit and readable, not shorthand tricks.
      //   ✗ !!value        ✓ Boolean(value)
      //   ✗ +input         ✓ Number(input)
      //   ✗ '' + count     ✓ String(count)
      'no-implicit-coercion': 'error',

      // Function parameters are read-only inputs: they can't be reassigned and
      // their properties can't be mutated. Mutating an argument changes the
      // caller's object behind its back, and breaks React's assumption that
      // props and state are immutable.
      //   ✗ function f(options) { options.id = 'x' }
      //   ✓ function f(options) { return { ...options, id: 'x' } }
      'no-param-reassign': ['error', { props: true }],

      // No `console.*` calls in committed code. Debug output belongs in the
      // browser devtools session, not in the shipped bundle.
      'no-console': 'error',

      // Size limits that keep functions small enough to read and test:
      // - complexity: at most 10 independent paths (if / case / && / ?: ...)
      // - max-depth:  at most 3 levels of nested blocks; use early returns instead
      // - max-params: at most 3 parameters; pass one options object beyond that
      //   ✗ createRow(team, played, won, drawn)
      //   ✓ createRow({ team, played, won, drawn })
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],

      // Use shorthand properties and methods in object literals.
      //   ✗ { id: id, render: function () {} }
      //   ✓ { id, render() {} }
      'object-shorthand': ['error', 'always'],

      // Build strings with template literals instead of `+` concatenation.
      //   ✗ 'Team ' + name + ' scored ' + goals
      //   ✓ `Team ${name} scored ${goals}`
      'prefer-template': 'error',

      // Named exports only, no default exports.
      // A default export can be imported under any name, so the same thing ends up
      // with different names across the codebase. Named exports keep one name
      // everywhere, so search, rename and auto-import stay reliable, and a wrong
      // import name is a compile error. (Config files are exempt below.)
      //   ✗ export default function App() {}
      //   ✓ export function App() {}
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use a named export instead of a default export.',
        },
      ],

      // ---------------------------------------------------------------------------
      // Imports / exports
      // ---------------------------------------------------------------------------

      // Imports, named imports and exports are sorted automatically (autofix),
      // so their order never shows up as noise in diffs or code review.
      // Only the module surface is sorted: object keys keep their meaningful order.
      'perfectionist/sort-imports': 'error',
      'perfectionist/sort-named-imports': 'error',
      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-named-exports': 'error',

      // ---------------------------------------------------------------------------
      // unicorn preset adjustments
      // ---------------------------------------------------------------------------

      // File names: PascalCase for React component files (App.tsx), camelCase for
      // everything else (main.tsx). The preset default would be kebab-case only.
      'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true } }],

      // Turned off: the rule bans `null` in favour of `undefined`, but `null` is
      // idiomatic in React (`return null` renders nothing) and is the only "empty"
      // value JSON can represent.
      'unicorn/no-null': 'off',

      // Turned off: the rule renames common abbreviations (`props` -> `properties`,
      // `ref` -> `reference`, `e` -> `event`), which fights established React naming.
      'unicorn/prevent-abbreviations': 'off',

      // Turned off: duplicate of `@typescript-eslint/require-array-sort-compare`,
      // which uses type information and so doesn't flag string arrays, where the
      // default sort is correct. Keeping both would report every `.sort()` twice.
      'unicorn/require-array-sort-compare': 'off',

      // Turned off: the rule removes the leading ` * ` from JSDoc lines, but that
      // prefix is the standard JSDoc format that editors generate and expect.
      //   ✓ /**
      //      * @type {import('stylelint').Config}
      //      */
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Project files are always imported through the `@/` alias, never by relative
      // path. Every import of a file looks the same from anywhere in the tree, and
      // moving a file doesn't break the imports inside it.
      //   ✗ import { App } from '../App.tsx'
      //   ✓ import { App } from '@/App.tsx'
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: String.raw`^\.{1,2}/`,
              message: 'Import project files through the `@/` alias instead of a relative path.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.tsx'],
    extends: [
      eslintReact.configs['strict-type-checked'],
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.strict,
      // Tailwind class correctness: unknown, conflicting, duplicate and deprecated
      // classes. Class order and line wrapping are left to Prettier.
      betterTailwindcss.configs['correctness-error'],
    ],
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      'better-tailwindcss': {
        // The stylesheet that defines which classes exist
        entryPoint: 'src/index.css',
      },
    },
    rules: {
      // Canonical, shortest spelling of a class: `size-4` instead of `w-4 h-4`
      'better-tailwindcss/enforce-canonical-classes': 'error',
      // Direction-dependent classes use logical properties (`ms-4`, `pe-2`, `text-start`)
      // instead of physical ones (`ml-4`, `pr-2`, `text-left`), so spacing and
      // alignment follow the reading direction in right-to-left languages too.
      // Sizes are exempt: `w-*` / `h-*` read more clearly than `inline-*` / `block-*`
      // and don't depend on reading direction in horizontal writing modes.
      'better-tailwindcss/enforce-logical-properties': [
        'error',
        { ignore: ['(^|:)(min-|max-)?[wh]-', '(^|:)size-'] },
      ],

      // `tabIndex` only on interactive elements, except a scrollable region: keyboard
      // users can only scroll it if it can take focus (WCAG 2.1.1). The region role
      // and its name tell screen readers what they landed on.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['region'] }],
    },
  },

  {
    files: ['src/**/*.test.{ts,tsx}'],
    extends: [
      vitest.configs.recommended,
      testingLibrary.configs['flat/react'],
      jestDom.configs['flat/recommended'],
    ],
    rules: {
      // Every test must assert something. Helpers that call `expect` internally, and
      // compile-time `expectTypeOf` checks, are registered here so they count as assertions.
      'vitest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'expectTypeOf', 'expectNoAxeViolations'] },
      ],

      // One spelling for test cases: `it(...)`, never mixed with `test(...)`
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],

      // `.only` and `.skip` must never be committed: `.only` silently disables every
      // other test in the file, `.skip` hides a test that should be fixed or deleted.
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',

      // `toStrictEqual` instead of `toEqual`: it also checks `undefined` properties
      // and class types, so `{ a: 1 }` doesn't match `{ a: 1, b: undefined }`.
      'vitest/prefer-strict-equal': 'error',

      // Every test file groups its tests in a top-level `describe` block, so test
      // output reads as "<unit> > <behaviour>".
      'vitest/require-top-level-describe': 'error',
    },
  },

  {
    files: ['e2e/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // Every test must assert something; `expect` covers Playwright's web-first
      // assertions (`toBeVisible`, ...) as well
      'playwright/expect-expect': 'error',
      // `.only` must never be committed: it silently disables every other test
      'playwright/no-focused-test': 'error',
      // `.skip` hides a test that should be fixed or deleted
      'playwright/no-skipped-test': 'error',
      // `toStrictEqual` instead of `toEqual`, as in the unit tests
      'playwright/prefer-strict-equal': 'error',
      // Web-first assertions retry until the page settles; reading a value and
      // asserting on it once doesn't, which makes tests flaky.
      //   ✗ expect(await heading.isVisible()).toBe(true)
      //   ✓ await expect(heading).toBeVisible()
      'playwright/prefer-web-first-assertions': 'error',
    },
  },

  {
    // Tool config files (vite, prettier, eslint, dependency-cruiser, ...) are loaded
    // through their default export, typically `export default defineConfig(...)`.
    files: ['*.config.{js,ts}', '.dependency-cruiser.js'],
    rules: {
      // Allow the default export these tools require
      'no-restricted-syntax': 'off',
      // A factory call at module level is the intended pattern here, not a side effect
      'unicorn/no-top-level-side-effects': 'off',
      // File names are dictated by the tools that look them up (`lint-staged.config.js`,
      // `.dependency-cruiser.js`)
      'unicorn/filename-case': 'off',
    },
  },

  {
    // Plain JS files are not part of any tsconfig, so type-aware rules can't run on them
    files: ['**/*.{js,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    // CommonJS config files, for tools that load their config with `require`
    // (lighthouserc.cjs)
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      // `require` / `module.exports` are what these tools expect
      '@typescript-eslint/no-require-imports': 'off',
      'unicorn/prefer-module': 'off',
    },
  },

  // Turns off every rule that would fight Prettier's formatting.
  // Must come after all configs above so it can override them.
  eslintConfigPrettier,

  {
    // Always use braces, even for one-line bodies:
    //   ✗ if (isDone) return
    //   ✓ if (isDone) { return }
    // `eslint-config-prettier` turns `curly` off, so it is re-enabled after it.
    // The `all` option is safe to combine with Prettier.
    rules: {
      curly: ['error', 'all'],
    },
  },
])
