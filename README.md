<p align="center">
  <img src="resources/logo-light.png#gh-light-mode-only" alt="Exify" width="360">
  <img src="resources/logo-dark.png#gh-dark-mode-only" alt="Exify" width="360">
</p>

<p align="center"><b>Fast batch EXIF editor for whole folders of photos.</b><br>
Camera & lens dropdowns, mismatch detection, filters, presets, date tools and undo — for JPEG, HEIC, TIFF, PNG and RAW.</p>

---

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
- **Undo** for every write in the session. Optionally keeps `_original` backups. File modified dates are preserved.
- **All tags** inspector, **CSV export**, lightbox preview, and drag & drop to open a folder.

## Getting started

```bash
npm install
npm run dev        # run the app with hot reload
npm run dist       # build a Windows installer into dist/
```

Requires Node 20+ on Windows. ExifTool is bundled automatically via [`exiftool-vendored`](https://github.com/photostructure/exiftool-vendored.js).

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

## Project layout

```
src/
  main/        Electron main process: ExifTool engine, undo history, scan, thumbnails (exify:// protocol)
  preload/     Typed IPC bridge (window.exify)
  shared/      Field definitions (EXIF tag mapping) and shared types
  renderer/    React UI
    data/      Camera & lens database (mounts, crop factors)
    lib/       Validation, filtering, dropdown option builders
    components/
resources/     Logo & icon sources (SVG) and renders
scripts/       make-logo.mjs (SVG generator), render-icons.cjs (rasteriser)
```

To regenerate the logo after editing `scripts/make-logo.mjs`, run `npm run logo`.

### Adding gear

Bodies go in `src/renderer/src/data/cameras.ts` and lenses in `src/renderer/src/data/lenses.ts`. Each entry is `[exifModelString, mount, friendlyLabel?]`. Gear you type that isn't in the list is remembered automatically under **My gear**.
