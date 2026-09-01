#!/usr/bin/env bash
# Slice the upscaled Tegaki hero take into the canvas scroll-scrub frame set.
# Usage: ./slice-frames.sh hero-2k.mp4 [outdir]
#
# Produces exactly 180 frames at 1600px wide, JPEG q86 — the sweet spot from the
# Seedance Website Pack: smooth enough to read as video, light enough to preload.
# Also exports the poster frame used for mobile / reduced-motion / no-JS.

set -euo pipefail

SRC="${1:?usage: slice-frames.sh <upscaled.mp4> [outdir]}"
OUT="${2:-frames}"
COUNT=180
WIDTH=1600
QUALITY=3   # ffmpeg -q:v 3 ≈ JPEG quality 86

command -v ffmpeg >/dev/null || { echo "ffmpeg not found"; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found"; exit 1; }

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
FPS=$(awk -v c="$COUNT" -v d="$DUR" 'BEGIN{printf "%.6f", c/d}')

echo "source     : $SRC"
echo "duration   : ${DUR}s"
echo "target     : $COUNT frames @ ${WIDTH}px  (fps=$FPS)"

mkdir -p "$OUT"
rm -f "$OUT"/hero_*.jpg

ffmpeg -v error -y -i "$SRC" \
  -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
  -frames:v "$COUNT" -q:v "$QUALITY" \
  "$OUT/hero_%03d.jpg"

# Poster = first frame, full quality. Serves mobile, reduced-motion and no-JS.
ffmpeg -v error -y -i "$SRC" -frames:v 1 -q:v 2 \
  -vf "scale=${WIDTH}:-2:flags=lanczos" "$OUT/../hero-poster.jpg"

ACTUAL=$(find "$OUT" -name 'hero_*.jpg' | wc -l | tr -d ' ')
BYTES=$(du -sh "$OUT" | cut -f1)

echo "written    : $ACTUAL frames  ($BYTES total)"
echo "poster     : $(dirname "$OUT")/hero-poster.jpg"

[ "$ACTUAL" -eq "$COUNT" ] || { echo "WARNING: expected $COUNT frames, got $ACTUAL"; exit 1; }

cat <<'NOTE'

Next:
  - Budget check: the frame set is desktop/tablet only. If total exceeds ~6 MB,
    drop WIDTH to 1400 before reducing the frame count — smoothness matters more
    than sharpness in a scrub.
  - hero-poster.jpg is what 375px, prefers-reduced-motion, and no-JS visitors get.
    They must never download the frame set (Design.md §3.2-1).
NOTE
