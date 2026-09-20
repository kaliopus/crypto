# tunnel.ps1  --  run on YOUR laptop (Windows PowerShell)
#
# Opens the encrypted SSH tunnel from your laptop to the pod. While this window
# stays open, http://127.0.0.1:8000 on your laptop is forwarded to the model
# inside the pod. All traffic goes through SSH; RunPod's proxy never sees it.
#
# Edit the three values below to match your pod (get them from `runpodctl pod get <id>`
# or the RunPod console -> Connect tab), then run:
#     powershell -ExecutionPolicy Bypass -File .\tunnel.ps1

$KeyPath = "$env:USERPROFILE\.ssh\whiterabbit_tunnel"   # your PRIVATE key (no .pub)
$PodIp   = "216.243.220.230"                             # pod public IP
$SshPort = "14979"                                       # pod SSH port (the 22 mapping)

Write-Host "Opening SSH tunnel to $PodIp`:$SshPort ..." -ForegroundColor Cyan
Write-Host "Keep this window OPEN. Local port 8000 -> pod's 127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to close the tunnel." -ForegroundColor DarkGray

ssh -i $KeyPath -p $SshPort "root@$PodIp" -N -L 8000:127.0.0.1:8000
