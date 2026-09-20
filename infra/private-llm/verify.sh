#!/usr/bin/env bash
# Verifies the TDX + NVIDIA attestation quotes for the running CVM and
# confirms the measured docker-compose.yml matches what's in this repo.
# Run this before trusting the endpoint with real prompts, and again
# any time you're unsure whether it's still the VM you deployed.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

phala cvms attestation private-llm-70b --verify-compose docker-compose.yml
