/**
 * build-mac.mjs
 *
 * Builds the macOS app, choosing a strategy that can actually run on the host OS:
 *
 *  - macOS  : universal binary (Intel x64 + Apple Silicon arm64), producing both
 *             the .dmg and the .zip. This is what the CI release uses.
 *  - Linux/Windows : `--universal` is darwin-only, and creating a .dmg requires
 *             Apple's `sips`, so we can only cross-build the .zip here — for both
 *             architectures. Run the GitHub Actions "Release" workflow (or build on
 *             a Mac) to get the .dmg.
 */
import { spawnSync } from 'node:child_process'

const isMac = process.platform === 'darwin'

const args = isMac
  ? ['--mac', '--universal', '--publish', 'never']
  : ['--mac', 'zip', '--x64', '--arm64', '--publish', 'never']

console.log(`\n> electron-builder ${args.join(' ')}   (host: ${process.platform})`)
if (!isMac) {
  console.log('> note: the .dmg target requires macOS, so only .zip is built here.\n')
}

const result = spawnSync('electron-builder', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
})

process.exit(result.status ?? 1)
