#!/usr/bin/env bash
# Run this from YOUR laptop, not from any remote/shared machine — it's
# the step that creates your confidential VM and starts billing.
#
# Prerequisites (one-time, on your laptop):
#   1. npm i -g @phala/cli
#   2. Create an account at https://cloud.phala.network and get an API key
#   3. phala auth login
#   4. cp .env.example .env   and fill it in
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example to .env and fill it in first." >&2
  exit 1
fi
set -a; source .env; set +a

: "${VLLM_API_KEY:?set VLLM_API_KEY in .env}"
: "${HF_TOKEN:?set HF_TOKEN in .env}"

echo "Deploying $MODEL_ID into a confidential H100 VM..."

phala cvms create \
  --name private-llm-70b \
  --compose docker-compose.yml \
  --env VLLM_API_KEY="$VLLM_API_KEY" \
  --env HF_TOKEN="$HF_TOKEN" \
  --env MODEL_ID="$MODEL_ID" \
  --env MAX_MODEL_LEN="${MAX_MODEL_LEN:-16384}" \
  --vcpu 16 --memory 65536 --disk 200 \
  --gpu h100:1

cat <<'EOF'

Deployed. Next steps:

  1. Wait for the model to download and load (watch progress):
       phala cvms logs private-llm-70b --follow

  2. Get your endpoint URL:
       phala cvms get private-llm-70b

  3. Verify the attestation BEFORE sending any real data — this is what
     actually proves Phala can't read your prompts:
       ./verify.sh

  4. Talk to it from your laptop:
       PHALA_ENDPOINT=<url from step 2> VLLM_API_KEY=<from .env> python3 client.py
EOF
