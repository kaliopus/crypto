# run-agent.ps1  --  run on YOUR laptop, in a SECOND window (keep tunnel.ps1 running in the first)
#
# Points Claude Code at your own WhiteRabbitNeo model through the tunnel.
# Claude Code runs on your laptop: it reads your files, runs commands, and makes
# network calls FROM your machine. Only the model's "thinking" happens on the pod,
# reached over the encrypted tunnel. The pod never touches your files or your network.
#
# Prereq (one time): install Claude Code -> https://claude.com/claude-code
#
# Then run:
#     powershell -ExecutionPolicy Bypass -File .\run-agent.ps1

# The model API key (the --api-key you set on llama-server). Never hard-code it
# here — set it in your shell before running so it stays out of the repo:
#     $env:WHITERABBIT_KEY = "<your-model-api-key>"
$ModelApiKey = $env:WHITERABBIT_KEY
if (-not $ModelApiKey) {
    Write-Host "Set WHITERABBIT_KEY first:  `$env:WHITERABBIT_KEY = '<your-model-api-key>'" -ForegroundColor Red
    exit 1
}

$env:ANTHROPIC_BASE_URL  = "http://127.0.0.1:8000"   # the tunnel endpoint on your laptop
$env:ANTHROPIC_AUTH_TOKEN = $ModelApiKey
$env:ANTHROPIC_MODEL     = "whiterabbit"             # any name; llama-server ignores it
$env:ANTHROPIC_SMALL_FAST_MODEL = "whiterabbit"      # avoid Claude Code calling a cloud model

Write-Host "Launching Claude Code against your local WhiteRabbitNeo model..." -ForegroundColor Cyan
Write-Host "Base URL: $env:ANTHROPIC_BASE_URL  (through the SSH tunnel)" -ForegroundColor DarkGray

# Sanity check: is the tunnel up and the model answering?
try {
    $body = '{"model":"whiterabbit","max_tokens":16,"messages":[{"role":"user","content":"ping"}]}'
    Invoke-RestMethod -Uri "$env:ANTHROPIC_BASE_URL/v1/messages" -Method Post `
        -Headers @{ "x-api-key" = $ModelApiKey; "anthropic-version" = "2023-06-01" } `
        -ContentType "application/json" -Body $body -TimeoutSec 10 | Out-Null
    Write-Host "Model responded. Starting Claude Code." -ForegroundColor Green
} catch {
    Write-Host "Could not reach the model at $env:ANTHROPIC_BASE_URL." -ForegroundColor Red
    Write-Host "Check that tunnel.ps1 is running in the other window and the server on the pod finished loading." -ForegroundColor Yellow
    exit 1
}

claude
