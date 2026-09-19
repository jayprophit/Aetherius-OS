<#
.SYNOPSIS
Launch Aetherius IDE — local development server + Agent Bridge integration.

.DESCRIPTION
This script starts the Aetherius IDE development server and the Agent Bridge
local service, then opens the IDE in your default browser.

.REQUIREMENTS
- Node.js + npm must be installed
- Agent Bridge must be running (start via: workspace\integration\BridgeService.py)
- This script assumes IDE-Workspace is at: C:\Users\jpowe\Desktop\IDE-Workspace

.PROPERTIES
- IDE launches at: http://127.0.0.1:5199
- Agent Bridge at: http://127.0.0.1:8471
- Press Ctrl+C to stop both servers
#>

# Change to IDE workspace app directory
cd "C:\Users\jpowe\Desktop\IDE-Workspace\workspace\app"

# Start Vite dev server
echo "Starting Aetherius IDE development server..."
npx vite --port 5199 --host 127.0.0.1 --strictPort &

# Wait a moment for the IDE to start, then open browser
Start-Sleep -Seconds 3

# Open IDE in default browser
Write-Host "Opening Aetherius IDE in browser..."
Start-Process "http://127.0.0.1:5199"

# Wait for user to press Ctrl+C
Write-Host "`n"Write-Host "Press Ctrl+C to stop both servers..."
$null = Read-Host "Press Enter to exit"

# Note: The vite process started with & will continue running;
# manual Ctrl+C or taskkill may be needed to fully stop.