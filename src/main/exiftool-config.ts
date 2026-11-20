import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// ExifTool has no tags for film stock or push/pull processing, so we register a
// tiny XMP namespace for them. Anything that reads XMP will carry the values
// along untouched; ExifTool itself only understands them with this config loaded.
const CONFIG = `%Image::ExifTool::UserDefined = (
    'Image::ExifTool::XMP::Main' => {
        exifyfilm => { SubDirectory => { TagTable => 'Image::ExifTool::UserDefined::exifyfilm' } },
    },
);
%Image::ExifTool::UserDefined::exifyfilm = (
    GROUPS => { 0 => 'XMP', 1 => 'XMP-exifyfilm', 2 => 'Image' },
    NAMESPACE => { 'exifyfilm' => 'https://github.com/wrrnstrpn/exify/ns/film/1.0/' },
    WRITABLE => 'string',
    FilmStock => { },
    PushPull => { Writable => 'real' },
);
1;
`

// Written to a temp file because ExifTool wants a path, and in a packaged app
// nothing inside the asar archive is a real file.
export function exiftoolConfigPath(): string {
  const dir = join(tmpdir(), 'exify-config')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'exify.config')
  writeFileSync(file, CONFIG, 'utf8')
  return file
}
