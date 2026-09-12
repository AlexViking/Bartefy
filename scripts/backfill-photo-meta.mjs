/** Backfill items.photo_meta for listings created before it was written.
 *
 *  Migration 005 added the column and nothing ever wrote to it, so every
 *  masonry cell guessed 4:3 and reflowed when the real photo landed. AddItem
 *  stores dimensions now (2a642c9), but only for NEW listings -- everything
 *  already in the catalogue still jumps.
 *
 *  This reads each listing's first photo, measures it, and writes the whole
 *  set back. Run once:
 *
 *    node scripts/backfill-photo-meta.mjs            # dry run, reports only
 *    node scripts/backfill-photo-meta.mjs --write    # actually writes
 *
 *  Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. The
 *  service role, because RLS lets people update only their own items and this
 *  touches everyone's.
 */
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WRITE = process.argv.includes('--write')

if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const db = createClient(URL, KEY, { auth: { persistSession: false } })

/** Read WxH out of the file header, no image library.
 *
 *  sharp would be the obvious tool and is deliberately not used: it is a
 *  native dependency, this repo does not have it, and the npm cache here is
 *  unreliable. Dimensions live in the first few dozen bytes of every format
 *  the app stores, so a Range request of 64KB is enough -- which also means
 *  this does not download the whole catalogue to measure it.
 */
function dimensions(buf) {
  // WebP: 'RIFF'....'WEBP' then a VP8/VP8L/VP8X chunk.
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16)
    if (fmt === 'VP8 ') {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    }
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21)
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }
    }
    if (fmt === 'VP8X') {
      return {
        w: (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1,
        h: (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1,
      }
    }
    return null
  }

  // PNG: IHDR is always the first chunk.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }

  // JPEG: walk the segments to the SOF marker that carries the size.
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      // SOF0..SOF15, excluding the four that are not frame headers.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) }
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  return null
}

/** Measure one image by URL. Returns null rather than throwing: one dead
 *  photo must not stop the run, and a row left unmeasured simply keeps the
 *  old behaviour. */
async function measure(url) {
  try {
    // 64KB is far more than any header needs, and avoids pulling whole photos.
    const res = await fetch(url, { headers: { Range: 'bytes=0-65535' } })
    if (!res.ok && res.status !== 206) return null
    return dimensions(Buffer.from(await res.arrayBuffer()))
  } catch {
    return null
  }
}

const { data: rows, error } = await db
  .from('items')
  .select('id, images, photo_meta')
  .not('images', 'is', null)
  .order('id')

if (error) {
  console.error('read failed:', error.message)
  process.exit(1)
}

let measured = 0
let skipped = 0
let failed = 0

for (const row of rows ?? []) {
  const images = Array.isArray(row.images) ? row.images : []
  const existing = Array.isArray(row.photo_meta) ? row.photo_meta : []

  // Already has usable meta for every photo: nothing to do.
  if (existing.length === images.length && existing.every((m) => m?.w && m?.h)) {
    skipped++
    continue
  }
  if (images.length === 0) {
    skipped++
    continue
  }

  const meta = []
  for (const src of images) {
    meta.push((await measure(src)) ?? { w: null, h: null })
  }

  const got = meta.filter((m) => m.w).length
  if (got === 0) {
    failed++
    console.warn(`item ${row.id}: no photo could be measured`)
    continue
  }

  if (WRITE) {
    const { error: upErr } = await db
      .from('items')
      .update({ photo_meta: meta })
      .eq('id', row.id)
      .select('id')
    if (upErr) {
      failed++
      console.warn(`item ${row.id}: write failed -- ${upErr.message}`)
      continue
    }
  }
  measured++
  process.stdout.write(`\r${WRITE ? 'wrote' : 'would write'} ${measured}...`)
}

console.log()
console.log(`${WRITE ? 'written' : 'would write'}: ${measured}`)
console.log(`already had meta / no photos: ${skipped}`)
console.log(`failed: ${failed}`)
if (!WRITE) console.log('\nDry run. Re-run with --write to apply.')
