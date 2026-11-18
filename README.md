<p align="center">
  <img src="resources/logo-light.png#gh-light-mode-only" alt="Exify" width="360">
  <img src="resources/logo-dark.png#gh-dark-mode-only" alt="Exify" width="360">
</p>

<p align="center"><b>Fast batch EXIF editor for whole folders of photos.</b><br>
Camera & lens dropdowns, mismatch detection, filters, presets, date tools and undo — for JPEG, HEIC, TIFF, PNG and RAW.</p>

<p align="center">
  <a href="https://github.com/wrrnstrpn/exify/releases/latest">Download for Windows</a> ·
  <a href="#features">Features</a> ·
  <a href="#building-from-source">Build from source</a>
</p>

<p align="center"><img src="docs/screenshots/mismatch.jpg" alt="Exify flagging an aperture of f/1.8 on an f/2.8 zoom lens" width="900"></p>

## Download

Get the latest **`Exify-Setup-x.y.z.exe`** from [Releases](https://github.com/wrrnstrpn/exify/releases/latest). It installs for your Windows user only and doesn't need admin rights. ExifTool is included, so there's nothing else to install.

> **Windows SmartScreen:** the installer isn't code-signed yet, so Windows may say *"Windows protected your PC"* the first time. Click **More info → Run anyway**.

Exify writes metadata into your files. **Keep backup copies** is on by default: the untouched original is kept next to each edited file as `name.jpg_original`. Undo also works for every write during a session. You can turn backups off in Settings once you trust your workflow.

## Features

- **Open a whole folder** (subfolders optional) and get a virtualized grid or sortable list of every photo, with thumbnails for JPEG, HEIC and RAW (from Windows' shell or the embedded RAW preview).
- **Batch editing.** Select one photo or thousands. Fields where the selection differs show as *Mixed* and are left alone unless you set them. Only files whose values actually change get written.
- **Camera & lens dropdowns.** Searchable lists of about 700 bodies and 900 lenses, film bodies included. They use the exact strings cameras write to EXIF (e.g. Sony `ILCE-7M4` is shown as *α7 IV*), so Lightroom profiles still match. Canon is covered in depth:
  - every EOS R, RF-S, 1D/5D/6D/7D, xxD, Rebel/Kiss (all regional names) and EOS M body, plus Canon film EOS & FD
  - near-complete RF, RF-S, EF, EF-S, EF-M and FD lens lines, including teleconverter combos
- **Smart linking.** Picking a lens fills in the lens maker. Picking a prime also fills in the focal length. The 35 mm-equivalent focal length is worked out from the body's crop factor (1.6× APS-C, 1.3× APS-H, …).
- **Mismatch detection.** A ⚠/⛔ marker appears next to the field, in the dropdown options and on the thumbnail:
  - an aperture wider than the lens allows (checked at the actual focal length on variable-aperture zooms)
  - a focal length outside the lens range, or a different focal length on a prime
  - a lens that can't mount on the body (RF on an EF DSLR, EF-S on full frame or on the EOS 10D, …)
  - a camera model paired with the wrong make, or a lens with the wrong lens maker
  - a 35 mm-equivalent focal length that doesn't match the crop factor
  - bad shutter speeds, future dates, invalid time zones or GPS
- **Filters:** search, camera, lens, folder, file type, date range, ISO, focal length and aperture ranges, rating, *missing* fields (no date, no GPS, …) and *flagged / errors / clean*.
- **Date tools:** shift by an offset to fix a wrong camera clock, or sequence dates in on-screen order (useful for film scans).
- **Presets** for gear combos, **Sync** fields from the focused photo, keywords that can be added to or removed from a whole batch, a ★ rating, GPS (paste `lat, lon`), copyright helper.
- **Safety:** backups on by default, undo for every write in the session, and file modified dates are preserved.
- **All tags** inspector, **CSV export**, lightbox preview, and drag & drop to open a folder.

<table>
  <tr>
    <td><img src="docs/screenshots/lens-dropdown.jpg" alt="Lens dropdown grouped by what fits the selected camera, with an incompatible RF lens flagged"></td>
    <td><img src="docs/screenshots/batch.jpg" alt="Batch editing twelve photos with Mixed values"></td>
  </tr>
  <tr>
    <td align="center"><sub>Lenses that fit the body come first; ones that don't are flagged.</sub></td>
    <td align="center"><sub>Batch-edit any number of photos at once.</sub></td>
  </tr>
</table>

### Keyboard

| Keys | Action |
| --- | --- |
| `Ctrl+O` | Open folder |
| `Ctrl+A` / `Esc` | Select all visible / clear selection |
| Click, `Ctrl`+click, `Shift`+click, arrows | Select |
| `Space` / double-click | Preview |
| `Ctrl+Enter` | Apply edits |
| `Ctrl+Z` | Undo last write |
| `Ctrl+F` | Search |
| `F5` | Rescan folder |

## About the gear database

The camera and lens lists are **best-effort**. Mainstream bodies and lenses (especially Canon, Nikon, Sony and Fujifilm) use the exact model strings those cameras write. Some entries are less certain, such as drone and phone model codes and very recent releases. If you spot a wrong or missing entry, please [open an issue](https://github.com/wrrnstrpn/exify/issues) or a pull request.

Gear you type that isn't in the list is remembered automatically under **My gear**.

Camera and lens names are trademarks of their respective owners. Exify is not affiliated with or endorsed by Canon, Nikon, Sony, Fujifilm or any other manufacturer.

## Building from source

```bash
npm install
npm run dev         # run the app with hot reload
npm test            # unit + ExifTool integration tests
npm run typecheck
npm run dist        # build a Windows installer into dist/
```

Requires Node 20+ on Windows.

### Project layout

```
src/
  main/        Electron main process: ExifTool engine, undo history, scan, thumbnails (exify:// protocol)
  preload/     Typed IPC bridge (window.exify)
  shared/      Field definitions (EXIF tag mapping) and shared types
  renderer/    React UI
    data/      Camera & lens database (mounts, crop factors)
    lib/       Validation, filtering, dropdown option builders
    components/
tests/         Vitest suites and image fixtures
resources/     Logo & icon sources (SVG) and renders
scripts/       Logo generator/rasteriser and Electron launch helpers
```

To regenerate the logo after editing `scripts/make-logo.mjs`, run `npm run logo`.

### Adding gear

Bodies go in `src/renderer/src/data/cameras.ts` and lenses in `src/renderer/src/data/lenses.ts`. Each entry is `[exifModelString, mount, friendlyLabel?]`. `npm test` checks for duplicates and unknown mounts.

## Credits & licence

Exify is [MIT licensed](LICENSE). It's built on [ExifTool](https://exiftool.org) by Phil Harvey and [exiftool-vendored](https://github.com/photostructure/exiftool-vendored.js) by PhotoStructure. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the bundled software and its licences.
