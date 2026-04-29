#!/bin/bash
# Fix mobile padding for all product pages (excluding lemon-slices.html which is already done)

# List of multi-line CSS product pages (citrus style with expanded breakpoints)
MULTILINE_PAGES=(
  "orange-wheel.html"
  "grapefruit-slices.html"
  "lime-wheel.html"
  "orange-slices.html"
  "grapefruit-wheel.html"
  "lime-slices.html"
  "lemon-wheel.html"
  "orange-powder.html"
  "lemon-powder.html"
  "grapefruit-powder.html"
  "apple-slices.html"
)

# List of single-line CSS product pages (dried fruits/powders/veg style)
SINGLELINE_PAGES=(
  "banana-chips.html"
  "mango-strips.html"
  "pear-slices.html"
  "pineapple-slices.html"
  "hibiscus-flowers.html"
  "beetroot-powder.html"
  "carrot-powder.html"
  "butternut-powder.html"
  "spinach-powder.html"
)

echo "Processing multi-line pages..."
for page in "${MULTILINE_PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "  Fixing $page"
  fi
done

echo "Processing single-line pages..."
for page in "${SINGLELINE_PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "  Fixing $page"
  fi
done

echo "Done listing files."
