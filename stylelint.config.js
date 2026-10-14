/**
 * @type {import('stylelint').Config}
 */
export default {
  extends: [
    // Stylelint's own rule set for modern CSS conventions and likely errors
    'stylelint-config-standard',
    // Orders properties by group: positioning, box model, typography, visual, misc
    'stylelint-config-recess-order',
    // Accessibility checks: focus styles, reduced motion, readable font sizes, ...
    '@double-great/stylelint-a11y/strict',
  ],

  ignoreFiles: ['dist/**', 'coverage/**', 'playwright-report/**', '.lighthouseci/**'],

  // Every `stylelint-disable` comment must explain itself, target a real rule
  // and still suppress something; otherwise it is an error.
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,

  rules: {
    // No `!important`. It breaks the cascade, and the only way to override it is
    // another `!important`.
    //   ✗ color: red !important;
    'declaration-no-important': true,

    // No ID selectors. IDs have very high specificity and can't be reused;
    // style with classes and keep IDs for anchors and ARIA references.
    //   ✗ #header { ... }      ✓ .header { ... }
    'selector-max-id': 0,

    // Keeps selectors flat and cheap to override. At most three classes or
    // pseudo-classes per selector, at most one type selector.
    //   ✗ .page .table .row .cell:hover { ... }
    'selector-max-specificity': '0,3,1',

    // No type selectors qualified by a class or attribute. `.button` should work
    // on any element, not only on `<a>`.
    //   ✗ a.button { ... }     ✓ .button { ... }
    'selector-no-qualifying-type': true,

    // Nested rules at most two levels deep, so the compiled selectors stay short.
    'max-nesting-depth': 2,

    // Colors as explicit values or tokens, not named keywords like `red`,
    // whose exact shade is unclear when reading the code.
    //   ✗ color: red;          ✓ color: #dc2626;
    'color-named': 'never',

    // Tailwind v4 is configured in CSS with its own at-rules (`@theme`, `@utility`,
    // `@custom-variant`, ...), which plain CSS doesn't know.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'source',
          'utility',
          'variant',
          'custom-variant',
          'apply',
          'reference',
          'plugin',
          'config',
        ],
      },
    ],

    // Tailwind is imported as a package name (`@import 'tailwindcss'`), which the
    // `url(...)` notation doesn't support.
    'import-notation': 'string',

    // Custom properties are kebab-case. A trailing `-*` is also allowed: Tailwind
    // uses it in `@theme` to reset a whole namespace (`--color-*: initial`).
    'custom-property-pattern': [
      String.raw`^([a-z][a-z0-9]*)(-[a-z0-9]+)*(-\*)?$`,
      { message: 'Expected custom property name to be kebab-case' },
    ],

    // Turned off: `display: none` is the correct way to remove content from both
    // the screen and the accessibility tree (e.g. a closed menu). The rule flags
    // every use, so it gives no signal.
    'a11y/no-display-none': null,

    // Turned off: enforces line heights on a fixed baseline grid, which is a
    // visual design choice, not an accessibility requirement.
    'a11y/line-height-is-vertical-rhythmed': null,
  },
}
