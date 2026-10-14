/**
 * Runs on the files staged for commit. Fixable problems are fixed and re-staged;
 * anything left fails the commit.
 *
 * Type checking and tests need the whole project, not single files, so they run
 * in the pre-push hook instead.
 *
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{ts,tsx,js}': ['eslint --max-warnings 0 --fix', 'prettier --write'],
  '*.css': ['stylelint --max-warnings 0 --fix', 'prettier --write'],
  '*.{json,md,html,yml,yaml}': 'prettier --write',
}
