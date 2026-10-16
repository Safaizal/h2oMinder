# H20Minder

Retro-hacker hydration reminder widget for your desktop. Log water intake, get reminders, and watch the terminal-style bottle fill up — with splash sounds, mood-based themes, and a live system-tray icon.

## Download

Grab the latest installer for your OS from the [**Releases page**](https://github.com/Safaizal/h2oMinder/releases/latest):

| OS      | File                                     |
| ------- | ---------------------------------------- |
| Windows | `h20minder-<version>-setup.exe`          |
| macOS   | `h20minder-<version>.dmg`                |
| Linux   | `h20minder-<version>.AppImage` or `.deb` |

> **Note:** the Windows and macOS builds are unsigned, so you may see a
> SmartScreen / Gatekeeper warning on first launch. On macOS, right-click the
> app → Open to approve it.

## Features

- `+250ml` / `+500ml` logging with synthesized glug/splash sounds
- Mood themes: dehydrated (amber) → hydrated (cyan) → flow state (green) → over-hydrated (midnight purple)
- Frosted-glass widget with matrix-rain backdrop
- Dynamic tray icon showing fill level (0–100%)
- Configurable daily goal + reminder interval with desktop notifications

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

> **macOS note:** the `.dmg` is created with Apple tooling (`sips`), so it can
> only be produced on macOS — pushing a tag runs the GitHub Actions **Release**
> workflow on a macOS runner and builds a universal `.dmg`/`.zip` for both Intel
> and Apple Silicon. Running `npm run build:mac` on Linux/Windows still works and
> cross-builds `.zip` bundles for both architectures.

### Release

Push a version tag and GitHub Actions builds all three platforms:

```bash
$ git tag v1.0.0 && git push origin v1.0.0
```

Installers are attached to the release automatically.
