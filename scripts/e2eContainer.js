/**
 * Runs the end-to-end tests in containers, with Docker or Podman, whichever is installed.
 * All three browser projects run, WebKit included: Playwright's WebKit build needs
 * Ubuntu's system libraries, so on other Linux distributions it only runs in a container.
 */
import { spawnSync } from 'node:child_process'
import process from 'node:process'

function isInstalled(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0
}

const engine = ['docker', 'podman'].find((command) => isInstalled(command))
if (engine === undefined) {
  throw new Error('Neither Docker nor Podman is installed.')
}

function compose(...composeArguments) {
  return spawnSync(engine, ['compose', ...composeArguments], { stdio: 'inherit' }).status ?? 1
}

// Containers left over from an earlier run are stopped first: `run` reuses a running
// app container even when its image is out of date
compose('down')
// `run --build` only rebuilds the service it runs, so the app image is built first;
// otherwise the tests would run against an old build of the app
let status = compose('build', 'web')
if (status === 0) {
  status = compose('--profile', 'test', 'run', '--rm', '--build', 'e2e')
}
// Stops the app container that `run` started
compose('down')
process.exitCode = status
