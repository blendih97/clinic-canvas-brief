#!/usr/bin/env bash
# Serve edge functions LOCALLY with the staged imaging + pilot-staging overlays.
# Builds a throwaway workdir so nothing under supabase/functions is modified.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WD="${IMAGING_DEV_WORKDIR:-/tmp/rinvita-imaging-workdir}"
rm -rf "$WD"; mkdir -p "$WD/supabase"
cp -r "$ROOT/supabase/functions" "$WD/supabase/functions"
cp "$ROOT/supabase/config.toml" "$WD/supabase/config.toml"
cp "$ROOT/supabase/pilot-staging/get-shared-brief.ts" "$WD/supabase/functions/get-shared-brief/index.ts"
cp -r "$ROOT/supabase/imaging-staging/functions/." "$WD/supabase/functions/"
# _shared from staging is merged into the existing _shared dir
cat >> "$WD/supabase/config.toml" <<'T'
  [functions.imaging-stream]
    verify_jwt = false
  [functions.imaging-session]
    verify_jwt = false
  [functions.get-shared-brief]
    verify_jwt = false
T
mkdir -p "$WD/supabase/functions/_ca" && cp /root/.ccr/ca-bundle.crt "$WD/supabase/functions/_ca/ca.pem"
GW="${IMAGING_DEV_PROXY_GW:-172.18.0.1}"
cat > "$WD/supabase/.env.local" <<V
HTTPS_PROXY=http://$GW:36008
HTTP_PROXY=http://$GW:36008
NO_PROXY=kong,127.0.0.1,localhost,supabase_kong_gnxctlydesugjdwbavdx,host.docker.internal
DENO_CERT=$WD/supabase/functions/_ca/ca.pem
V
cd "$WD"
exec npx supabase functions serve --env-file "$WD/supabase/.env.local"
