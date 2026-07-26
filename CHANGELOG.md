# Changelog

All notable Augorithm changes are documented here.

## [1.4.4] — 2026-07-26

### Added

- New glass-finished AU brand icon based on the artwork supplied by Kaung Khant Ko
- Native-size icon assets for macOS, Windows, iPad/PWA, browser tabs, and `.augo` documents

### Improved

- Consistent AU branding in the title bar, About dialog, installed app, shortcuts, and project files
- Windows `.augo` file registration so saved projects use the Augorithm icon and open in Augorithm
- Versioned offline icon caching for installed iPad web apps

## [1.4.3] — 2026-07-26

### Added

- Direct flowchart symbol editing with canvas-focused controls
- Clipboard copy for pasting flowcharts into Canva, PowerPoint, and other apps
- Automatic project and export filenames based on algorithm content
- Database normalization workspace with guided 1NF, 2NF, and 3NF decomposition
- Desktop Python editor, export, console input, and local Python 3 runner
- Typed pseudocode-to-Java generation with `Scanner` input and Java-safe expressions
- IDE-style generated-source viewer with syntax highlighting, line numbers, wrapping, copy, and language-aware filenames
- Save/export reveal actions for Finder and File Explorer

### Improved

- Independent loop and branch connector ports to prevent duplicated arrowheads
- Cleaner `Next`, `Done`, `True`, and `False` label placement
- Continuous, high-contrast flowchart connectors in the canvas and exported files
- Burmese button sizing and overflow handling
- Version and update comparison logic
- Pseudocode compatibility with natural classroom statements and compact block endings

### Fixed

- Duplicate arrows before output symbols
- Split or missing connector segments in PNG and SVG exports
- Older releases being offered as updates to newer installations
- Saved projects reverting to the starter template
- `.augo` file association and reopen behavior

## [1.4.1] — 2026-07-26

- Added version information and in-app update checks.
- Improved loop routing and export-safe line weights.
- Added iPad progressive web app support and Note Mode.

## [1.3.9] — 2026-07-25

- Initial public desktop release for macOS and Windows.
