# Third-party notices

Exify is MIT-licensed (see [LICENSE](LICENSE)). The installer also ships the
following third-party software, each under its own licence.

## ExifTool

- Author: Phil Harvey — <https://exiftool.org>
- Licence: the same terms as Perl itself (the Artistic License or the GNU General
  Public License, at your option).
- Use: Exify runs ExifTool as a separate program to read and write all metadata.
  It is distributed unmodified, including the bundled Perl runtime for Windows. On
  Linux it runs on the system's Perl.

## exiftool-vendored

- Author: PhotoStructure, Inc. — <https://github.com/photostructure/exiftool-vendored.js>
- Licence: MIT
- Use: the Node.js wrapper that bundles and manages the ExifTool processes.

## Electron

- <https://www.electronjs.org> — MIT. The installer includes Electron's own
  `LICENSE.electron.txt` and the Chromium licences (`LICENSES.chromium.html`).

## Other libraries

- React and React DOM — MIT — <https://react.dev>
- Zustand — MIT — <https://github.com/pmndrs/zustand>
- Leaflet — BSD-2-Clause — <https://leafletjs.com>
- electron-updater — MIT — <https://github.com/electron-userland/electron-builder>
- @photostructure/tz-lookup — CC0-1.0 — <https://github.com/photostructure/tz-lookup>

## Map data

Map tiles are loaded at runtime from OpenStreetMap and are not shipped in the app.
Map data © OpenStreetMap contributors, available under the Open Database License
(<https://www.openstreetmap.org/copyright>).

Build-time-only tools (Vite, electron-vite, electron-builder, TypeScript, Vitest)
are not shipped in the app.

## Trademarks

Camera and lens names (Canon, Nikon, Sony, Fujifilm, and others) appear only to
identify the equipment that wrote a photo's metadata. They are the trademarks of
their respective owners. Exify is not affiliated with or endorsed by any of them.
