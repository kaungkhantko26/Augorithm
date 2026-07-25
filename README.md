# Augorithm

Augorithm is a pseudocode-to-flowchart learning environment for macOS, Windows, and iPad. It converts beginner-friendly pseudocode into connected flowcharts, validates syntax, executes algorithms with interactive input, and exports flowcharts as PNG or SVG.

Built by **Kaung Khant Ko**.

## Download

Get the newest packages from [GitHub Releases](https://github.com/kaungkhantko26/Augorithm/releases/latest):

- Windows 10/11 x64: `Augorithm-1.3.7-windows-x64-portable.zip`
- Apple-silicon macOS: `Augorithm-1.3.7-arm64.zip`

## Install on Windows

1. Download `Augorithm-1.3.7-windows-x64-portable.zip` from Releases.
2. Right-click the ZIP and choose **Extract All**.
3. Open the extracted folder and double-click `Augorithm.exe`.
4. If Microsoft Defender SmartScreen appears, review the unknown-publisher warning before deciding whether to continue.

The portable build is not Authenticode-signed, so Windows may report an unknown publisher.

## Install on macOS

1. Download `Augorithm-1.3.7-arm64.zip` from Releases.
2. Double-click the ZIP file.
3. Drag **Augorithm.app** into **Applications**.
4. Control-click Augorithm in Applications and choose **Open**.
5. Confirm **Open** if macOS displays an unidentified-developer warning.

The macOS build is ad-hoc signed but not Apple-notarized.

## Use on iPad

1. Open the Augorithm web app in Safari at `https://kaungkhantko26.github.io/Augorithm/`.
2. Tap **Share**, then **Add to Home Screen**.
3. Open Augorithm from the Home Screen for a full-screen app experience.
4. Tap the **✎ Note Mode** button for a focused, touch-friendly pseudocode notebook.

The iPad app works offline after its first successful load. Projects can be opened from Files and saved as `.augo` downloads. Source code and flowcharts can also be exported directly from Safari.

## Open and save projects

Projects use the `.augo` extension. The installers register this file type, so saved projects can be opened by double-clicking them in Finder or File Explorer.

Use **File → Save As…** for a new project and **File → Save** afterward. Augorithm keeps a recovery draft for unsaved work.

## Features

- Flexible pseudocode parser with common classroom formats
- Natural classroom statements including `Set row to 1`, `Add 2 to col`, `Display value`, `Display newline`, and compact `Endwhile`
- Quote-aware inline statements: forms such as `Output "Fail" End If` are separated safely without changing quoted text
- IDE-style pseudocode editor with an active-line gutter, cursor position, and problem markers
- Persistent light/dark theme toggle with high-contrast editor and flowchart colors
- Fully closed two-layer outlines for decision, input/output, and loop symbols
- Real-time connector regeneration after edits, resizing, theme changes, fitting, and zooming
- Tab/Shift+Tab indentation, smart Enter, automatic block completion, and four-space formatting
- Safe syntax repair on Build/Run for missing program wrappers, block endings, `NEXT` variables, and common assignment forms
- One-click Format and Fix Errors commands with macOS/Windows keyboard shortcuts
- Flowgorithm-style `For` loops with a hexagonal control node, right-side `Next` path, downward `Done` path, and body return connector
- Continuous, gap-free loop and True/False branch connectors with bold export-safe lines
- Flowgorithm-style declaration, assignment, input, output, start, and end symbol colors and shapes
- Flowchart zoom, fit, and pan
- PNG and editable SVG export
- Guided console input and executable expressions
- Extended functions: `Round`, `Floor`, `Ceiling`, `Pow`, `Upper`, `Lower`, `Trim`, `Substring`, `Min`, `Max`, trigonometry, and type conversion
- Variables inspector and line-level validation
- Pseudocode, Python, Swift, and JavaScript source views
- English and Burmese interface modes
- `.augo` save, open, recovery, and double-click support
- Native Windows x64 and Apple-silicon macOS packages
- Installable, offline-capable iPad web app with touch controls and focused Note Mode

## Build from source

Requires Node.js 20 or newer and npm.

```bash
npm install
npm start
```

Build desktop packages:

```bash
npm run windows
npm run pack
```

Build output is written to `dist/`.

To test the iPad/web app locally:

```bash
python3 -m http.server 4173 --directory app
```

Then open `http://localhost:4173`. The GitHub Pages workflow deploys the same `app/` directory whenever its files change on `main`.

## Project structure

```text
app/          Interface, parser, interpreter, and flowchart renderer
electron/     Desktop integration, dialogs, and file handling
package.json  Build and packaging configuration
```

## License

MIT License. See [LICENSE](LICENSE).

Augorithm is an original educational project inspired by visual flowchart-learning workflows. It is not affiliated with Flowgorithm or Auston College.
