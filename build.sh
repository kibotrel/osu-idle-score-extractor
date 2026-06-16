#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/builds"
VERSION="$(grep '"version"' "$SCRIPT_DIR/manifest.json" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')"
OUTPUT_FILE="$OUTPUT_DIR/${VERSION}.zip"

mkdir -p "$OUTPUT_DIR"
cd "$SCRIPT_DIR"

zip -r "$OUTPUT_FILE" \
  background/ \
  content/ \
  icons/ \
  popup/ \
  LICENSE \
  manifest.json \
  README.md

echo "Created: $OUTPUT_FILE"
