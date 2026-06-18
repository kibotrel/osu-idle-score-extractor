#!/bin/bash

set -e

OUTPUT_DIR="builds"
VERSION="$(grep '"version"' manifest.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')"

TMP_DIR="$(mktemp -d)"
BUNDLE_FILES=(background/ content/ icons/ popup/ LICENSE README.md)

mkdir -p "$OUTPUT_DIR"

CHROME_OUTPUT_FILE="$OUTPUT_DIR/${VERSION}-chrome.zip"

jq '. + {"background": {"service_worker": "background/background.js"}}' manifest.json > "$TMP_DIR/manifest.json"
zip -j "$CHROME_OUTPUT_FILE" "$TMP_DIR/manifest.json"
zip -r "$CHROME_OUTPUT_FILE" "${BUNDLE_FILES[@]}"
echo "Created: $CHROME_OUTPUT_FILE"

FIREFOX_OUTPUT_FILE="$OUTPUT_DIR/${VERSION}-firefox.zip"

jq '. + {"background": {"scripts": ["background/background.js"]}, "browser_specific_settings": {"gecko": {"id": "osu-idle-score-extractor@demonwaves", "data_collection_permissions": {"required": ["none"]}}}}' manifest.json > "$TMP_DIR/manifest.json"
zip -j "$FIREFOX_OUTPUT_FILE" "$TMP_DIR/manifest.json"
zip -r "$FIREFOX_OUTPUT_FILE" "${BUNDLE_FILES[@]}"
echo "Created: $FIREFOX_OUTPUT_FILE"

rm -rf "$TMP_DIR"
