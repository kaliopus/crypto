#!/usr/bin/env bash
# Run this INSIDE the pod (paste into your SSH session), NOT on your laptop.
# It restarts llama-server with the flags a tool-using agent needs:
#   --jinja      -> enables the chat template engine, required for tool calling
#   -fa on       -> flash attention
# The server keeps binding to 127.0.0.1 only, so it stays reachable exclusively
# through your SSH tunnel. Nothing here is exposed to RunPod's HTTP proxy.
#
# The model API key is read from the LLMKEY env var that was baked into the pod
# at creation, so you don't have to paste the secret again.
set -euo pipefail

MODEL="bartowski/Llama-3.1-WhiteRabbitNeo-2-70B-GGUF:Q4_K_M"
BIN=/opt/llama.cpp/build/bin/llama-server

if [[ -z "${LLMKEY:-}" ]]; then
  echo "LLMKEY env var is empty. Set it to your model API key and re-run:" >&2
  echo "  LLMKEY=<your-key> ./restart-server-on-pod.sh" >&2
  exit 1
fi

echo "[1/3] stopping the current llama-server (if any)..."
pkill -f "$BIN" 2>/dev/null || true
sleep 3

echo "[2/3] starting llama-server with --jinja (tool calling enabled)..."
# Do NOT pass --chat-template here: it takes a Jinja template *source string*,
# not a built-in template name. Passing a name like "llama3" renders to that
# literal text and silently discards every message. The GGUF's own template is
# correct, so --jinja alone is what you want.
cd /opt/llama.cpp
setsid nohup "$BIN" \
  -hf "$MODEL" \
  --host 127.0.0.1 --port 8000 \
  --api-key "$LLMKEY" \
  --jinja -fa on \
  -ngl 99 -c 16384 \
  > /tmp/llama-server.log 2>&1 &

echo "[3/3] launched. Tail the log to watch it load:"
echo "    tail -f /tmp/llama-server.log"
echo
echo "Once you see 'server is listening', the tool-calling endpoints are live:"
echo "    /v1/chat/completions   (OpenAI style)"
echo "    /v1/messages           (Anthropic style, for Claude Code)"
