/**
 * Commit messages follow Conventional Commits: `type(scope?): subject`,
 * e.g. `feat: add standings table` or `fix(table): keep header sticky`.
 *
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Subject line fits in `git log --oneline` and GitHub's commit list
    // without being truncated
    'header-max-length': [2, 'always', 72],
    // Scopes are lowercase single words or kebab-case: `feat(table): ...`
    'scope-case': [2, 'always', 'kebab-case'],
    // A blank line between subject and body is required, not just recommended
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
}
