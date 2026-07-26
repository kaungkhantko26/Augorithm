<div align="center">
  <img src="app/assets/icons/icon-glass-1024.png" alt="Augorithm glass AU app icon" width="112" height="112">

  # Augorithm

  **Think it. Chart it. Run it.**

  A visual pseudocode editor, standards-based flowchart generator, and algorithm runner for macOS, Windows, and iPad.

  [![Latest release](https://img.shields.io/github/v/release/kaungkhantko26/Augorithm?display_name=tag&sort=semver)](https://github.com/kaungkhantko26/Augorithm/releases/latest)
  [![GitHub Pages](https://github.com/kaungkhantko26/Augorithm/actions/workflows/pages.yml/badge.svg)](https://kaungkhantko26.github.io/Augorithm/)
  [![Platforms](https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20iPad-0A376D)](#install-augorithm)
  [![License: MIT](https://img.shields.io/badge/license-MIT-F5A800)](LICENSE)

  [Web app](https://kaungkhantko26.github.io/Augorithm/) ·
  [Download](https://github.com/kaungkhantko26/Augorithm/releases/latest) ·
  [Report a problem](https://github.com/kaungkhantko26/Augorithm/issues)
</div>

---

Augorithm turns beginner-friendly pseudocode into connected, editable flowcharts in real time. It validates and runs algorithms with guided console input, exports presentation-ready PNG and SVG diagrams, and supports English and Burmese interfaces.

Augorithm is built by **Kaung Khant Ko** as an independent computer-science learning tool inspired by visual algorithm-design workflows.

## What you can do

- Write classroom pseudocode in an IDE-style editor with formatting, indentation, validation, and safe syntax repair.
- Generate standard flowchart symbols with clear `True`/`False`, `Next`, `Done`, branch, and loop routing.
- Edit flowchart symbols directly, then zoom, pan, fit, copy, or export the canvas as PNG or editable SVG.
- Run algorithms with interactive `INPUT`, expressions, variables, loops, decisions, and common functions.
- Save and reopen complete `.augo` projects, including recovery for unsaved work.
- Translate the interface between English and Burmese.
- Use the database-normalization workspace for guided 1NF, 2NF, and 3NF decomposition.
- Generate readable Java, Python, Swift, and JavaScript from pseudocode.
- Write and run Python in the desktop app.
- Install the offline-capable web app on iPad.

## Install Augorithm

The current source and package version is **1.4.4**.

### macOS

1. Open [the latest release](https://github.com/kaungkhantko26/Augorithm/releases/latest).
2. Download `Augorithm-1.4.4-arm64.zip`.
3. Open the ZIP and drag **Augorithm.app** into **Applications**.
4. On first launch, Control-click the app, choose **Open**, then confirm.

The current macOS build supports Apple silicon. It is not Apple-notarized, so macOS may show an unidentified-developer warning.

### Windows

1. Open [the latest release](https://github.com/kaungkhantko26/Augorithm/releases/latest).
2. Download `Augorithm-1.4.4-x64.exe`.
3. Run the installer and choose an installation folder.
4. Open Augorithm from the Start menu or desktop shortcut.

The current Windows build is not Authenticode-signed, so Microsoft Defender SmartScreen may show an unknown-publisher warning.

### iPad

1. Open the [Augorithm web app](https://kaungkhantko26.github.io/Augorithm/) in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Launch Augorithm from the Home Screen.
4. Use **Note Mode** for a focused, touch-friendly pseudocode workspace.

After the first successful load, the iPad app can work offline. Projects can be opened from Files and saved as `.augo` downloads.

Saved `.augo` project files use the same glass AU icon as the application. Standard exports such as PNG, SVG, Java, Python, and JavaScript keep their native system file types so they remain easy to open in presentation, design, and development tools.

## Quick start

Enter an algorithm such as:

```text
Start
    Set total to 0
    For count = 1 to 5
        Input number
        Set total to total + number
    Next
    Display total
End
```

Then:

1. Select **Build** to validate and generate the flowchart.
2. Select **Run** and provide values when Augorithm prompts for input.
3. Open **Flowchart** to edit or inspect the diagram.
4. Open **Source** to generate Java, Python, Swift, JavaScript, or Pseudocode with live filenames, line numbers, copy, and export controls.
5. Use **Copy**, **PNG**, or **SVG** to place the flowchart in Canva, PowerPoint, documents, or other design tools.

## Pseudocode support

Augorithm accepts several common teaching styles, including:

- Assignment: `Set score to 80`, `score = 80`, `Add 2 to score`
- Input/output: `Input name`, `Display name`, `Output "Hello"`
- Decisions: `If ... Then`, `Else If`, `Else`, `End If`
- Loops: `While ...`, `End While`, `For ... To ... Step ...`, `Next`
- Compact endings such as `Endwhile`
- Quote-aware inline statements such as `Output "Fail" End If`

The formatter uses four-space indentation and supports Tab, Shift+Tab, smart Enter, and automatic block completion.

## Java source generation

Java is the default generated-source target. Augorithm converts normalized pseudocode into a complete Java class with:

- A safe class name derived from the project name
- Typed `int`, `double`, `String`, `boolean`, and `char` declarations
- `Scanner`-based console input
- Java conditions, `Objects.equals` string comparisons, and `Math` functions
- Inclusive positive or negative `For` loops
- `If`/`Else If`/`Else`, `While`, comments, assignments, and output
- Matching `.java` export filenames, live syntax highlighting, line numbers, copy, and wrapping

## Flowcharts and exports

- Standard start/end, declaration, assignment, input/output, decision, and loop shapes
- Fully closed, high-contrast symbol outlines
- Independent connector ports to prevent duplicate arrows and overlapping routes
- Continuous export-safe branch and loop lines
- Direct symbol editing in the flowchart canvas
- Zoom, fit, pan, PNG export, editable SVG export, and clipboard copy
- Automatic project and export filenames based on the algorithm

## Projects, files, and updates

Augorithm projects use the `.augo` extension. The desktop installers register this file type so projects can be opened from Finder or File Explorer.

Use **File → Save As…** for a new project and **File → Save** for later changes. After a desktop save or export, Augorithm opens Finder or File Explorer with the new file selected.

The macOS and Windows apps check GitHub Releases for updates. Click the version badge or choose **Help → Check for Updates…**. After a download finishes, choose **Restart to update**. On iPad, use the version panel’s **Reload to update** action.

## Build from source

Requirements:

- Node.js 20 or newer
- npm

```bash
npm install
npm start
```

Build desktop packages:

```bash
npm run windows
npm run dmg
```

Build output is written to `dist/`.

Test the iPad/web app locally:

```bash
python3 -m http.server 4173 --directory app
```

Then open `http://localhost:4173`. The Pages workflow deploys `app/` when web-app files change on `main`.

## Project structure

```text
app/             Interface, parser, interpreter, flowchart renderer, and PWA
electron/        Desktop integration, native dialogs, updates, and file handling
.github/         GitHub Pages workflow and repository metadata guidance
package.json     Application metadata, scripts, and packaging configuration
```

## Support and feedback

Please use [GitHub Issues](https://github.com/kaungkhantko26/Augorithm/issues) for reproducible bugs and feature requests. Include your operating system, Augorithm version, pseudocode sample, and a screenshot when relevant.

## License

Augorithm is available under the [MIT License](LICENSE).

Copyright © 2026 Kaung Khant Ko.

## Independence notice

Augorithm is an original, independent educational project. It is not affiliated with, endorsed by, or sponsored by Flowgorithm or Auston College.
