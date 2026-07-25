# Augorithm

Augorithm is a desktop pseudocode-to-flowchart learning environment for macOS and Windows. It converts beginner-friendly pseudocode into connected flowcharts, validates syntax, executes algorithms with interactive input, and exports flowcharts as PNG or SVG.

Built by **Kaung Khant Ko**.

## Download

Get the newest packages from [GitHub Releases](https://github.com/kaungkhantko26/Augorithm/releases/latest):

- Windows 10/11 x64: `Augorithm-1.3.2-x64.exe`
- Apple-silicon macOS: `Augorithm-1.3.2-arm64.zip`

## Install on Windows

1. Download `Augorithm-1.3.2-x64.exe` from Releases.
2. Double-click the installer.
3. If Microsoft Defender SmartScreen appears, review the unknown-publisher warning before deciding whether to continue.
4. Select the installation folder and choose **Install**.
5. Open Augorithm from the Desktop shortcut or Start menu.

The installer is not Authenticode-signed, so Windows may report an unknown publisher.

## Install on macOS

1. Download `Augorithm-1.3.2-arm64.zip` from Releases.
2. Double-click the ZIP file.
3. Drag **Augorithm.app** into **Applications**.
4. Control-click Augorithm in Applications and choose **Open**.
5. Confirm **Open** if macOS displays an unidentified-developer warning.

The macOS build is ad-hoc signed but not Apple-notarized.

## Open and save projects

Projects use the `.augo` extension. The installers register this file type, so saved projects can be opened by double-clicking them in Finder or File Explorer.

Use **File → Save As…** for a new project and **File → Save** afterward. Augorithm keeps a recovery draft for unsaved work.

## Features

- Flexible pseudocode parser with common classroom formats
- Flowgorithm-style `For` loops with a hexagonal control node, right-side `Next` path, downward `Done` path, and body return connector
- Connected True/False flowchart branches and bold export-safe lines
- Flowgorithm-style declaration, assignment, input, output, start, and end symbol colors and shapes
- Flowchart zoom, fit, and pan
- PNG and editable SVG export
- Guided console input and executable expressions
- Variables inspector and line-level validation
- Pseudocode, Python, Swift, and JavaScript source views
- English and Burmese interface modes
- `.augo` save, open, recovery, and double-click support
- Native Windows x64 and Apple-silicon macOS packages

## Build from source

Requires Node.js 20 or newer and npm.

```bash
npm install
npm start
```

Build packages:

```bash
npm run windows
npm run pack
```

Build output is written to `dist/`.

## Project structure

```text
app/          Interface, parser, interpreter, and flowchart renderer
electron/     Desktop integration, dialogs, and file handling
package.json  Build and packaging configuration
```

## License

MIT License. See [LICENSE](LICENSE).

Augorithm is an original educational project inspired by visual flowchart-learning workflows. It is not affiliated with Flowgorithm or Auston College.
