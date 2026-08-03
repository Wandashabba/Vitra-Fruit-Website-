#!/bin/bash
# TEMPORARY Gmail SMTP stopgap — run from vitra-fruit-react/:  bash scripts/set-gmail-smtp-stopgap.sh
# Points the site's outgoing email at Gmail using the app password already in .env
# (never printed). Revert to GoDaddy once the orderinfo@ mailbox password is known.
set -euo pipefail
cd "$(dirname "$0")/.."

GMAIL_USER="wandileshaba96@gmail.com"

if ! grep -q '^SMTP_PASS=' .env; then echo "ERROR: SMTP_PASS not found in .env"; exit 1; fi

echo "==> Logging in to Vercel (browser will open — approve with the wandashabba account)"
npx -y vercel@latest login

echo "==> Linking project"
npx -y vercel@latest link --yes --project vitra-fruit-website-vyda

echo "==> Setting Gmail SMTP values (production + preview)"
for ENVT in production preview; do
  printf '%s' 'smtp.gmail.com' | npx -y vercel@latest env add SMTP_HOST "$ENVT" --force
  printf '%s' '465'            | npx -y vercel@latest env add SMTP_PORT "$ENVT" --force
  printf '%s' "$GMAIL_USER"    | npx -y vercel@latest env add SMTP_USER "$ENVT" --force
  grep '^SMTP_PASS=' .env | cut -d= -f2- | tr -d '[:space:]' | npx -y vercel@latest env add SMTP_PASS "$ENVT" --force
done

echo ""
echo "==> Done. Env vars now:"
npx -y vercel@latest env ls | grep -E "SMTP" || true
echo ""
echo "All set — now tell Claude to redeploy and verify."
