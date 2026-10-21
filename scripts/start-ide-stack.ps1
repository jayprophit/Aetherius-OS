<#
.SYNOPSIS
    Start the Aetherius IDE and everything it needs, and check each step.

.DESCRIPTION
    The IDE is only useful when it can reach a model. The chain is:

        Ollama  ->  Agent Bridge  ->  Aetherius IDE

    Ollama serves the local models. Agent Bridge is the execution
    runtime, and it is what the IDE talks to. The IDE is the interface.

    Each of the three is started only if it is not already running, and
    each is waited for and checked, so that the launcher says what is
    actually true rather than what was hoped for.

    The Bridge is given the IDE's origin explicitly. Without it the
    Bridge sends no CORS header, the browser refuses the response, and
    the IDE shows "backend: disconnected" with no error anywhere.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/start-ide-stack.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/start-ide-stack.ps1 -Stop
#>
[CmdletBinding()]
param(
    # Stop the stack instead of starting it.
    [switch]$Stop,

    # The port the IDE's development server listens on.
    [int]$IdePort = 5199,

    # The port Agent Bridge listens on.
    [int]$BridgePort = 8471,

    # The port the local model runtime listens on.
    [int]$ModelPort = 11434
)

$ErrorActionPreference = 'Stop'

# scripts\ lives inside Aetherius-OS, which lives inside the projects root.
$AetheriusRoot = Split-Path -Parent $PSScriptRoot
$ProjectsRoot = Split-Path -Parent $AetheriusRoot
$BridgeRoot = Join-Path $ProjectsRoot 'Agent-Bridge'
$IdeApp = Join-Path $AetheriusRoot 'apps\IDE-Workspace\workspace\app'
$IdeWorkspace = Join-Path $AetheriusRoot 'apps\IDE-Workspace\workspace'

function Say([string]$message) {
    Write-Host $message
}

function Port-Listening([int]$port) {
    try {
        $client = [Net.Sockets.TcpClient]::new()
        $task = $client.ConnectAsync('127.0.0.1', $port)
        if (-not $task.Wait(1500)) { return $false }
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function Wait-For([int]$port, [int]$seconds, [string]$what, $process = $null) {
    $deadline = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $deadline) {
        if (Port-Listening $port) { return $true }
        if ($process -and $process.HasExited) {
            Say "  ! $what exited immediately with code $($process.ExitCode)"
            return $false
        }
        Start-Sleep -Milliseconds 400
    }
    Say "  ! $what did not come up on port $port within $seconds seconds"
    return $false
}

function Wait-ForModels([int]$seconds) {
    # The port opens well before the model runtime can answer. Until it can,
    # the Bridge reports no models and the IDE shows an empty ModelCenter, so
    # waiting for the port is not enough.
    $deadline = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $tags = Invoke-RestMethod -Uri "http://127.0.0.1:$ModelPort/api/tags" -TimeoutSec 10
            $count = @($tags.models).Count
            if ($count -gt 0) { return $count }
        } catch {
            # not ready yet
        }
        Start-Sleep -Milliseconds 700
    }
    return 0
}

if ($Stop) {
    Say 'Stopping the stack.'
    foreach ($name in @('ollama', 'python', 'node')) {
        Get-Process -Name $name -ErrorAction SilentlyContinue |
            Where-Object { $_.Path -like '*Ollama*' -or $_.ProcessName -eq 'ollama' } |
            ForEach-Object { Say "  stopping $($_.ProcessName) ($($_.Id))"; Stop-Process -Id $_.Id -Force }
    }
    Say '  the IDE development server and the Bridge are stopped with their own windows'
    return
}

Say ''
Say 'Aetherius IDE stack'
Say '===================='
Say "  Aetherius OS  : $AetheriusRoot"
Say "  Agent Bridge  : $BridgeRoot"
Say "  IDE           : $IdeApp"
Say ''

# 1. The local model runtime.
Say '1. The local model runtime'
if (Port-Listening $ModelPort) {
    Say "  already running on port $ModelPort"
    $existing = Wait-ForModels 20
    if ($existing -gt 0) { Say "  serving $existing local model(s)" }
} else {
    $ollama = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollama) {
        $candidate = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
        if (Test-Path $candidate) { $ollama = Get-Item $candidate }
    }
    if (-not $ollama) {
        Say '  ! Ollama is not installed, so the Bridge will report UNAVAILABLE'
        Say '    and the IDE will show no models.'
    } else {
        Say "  starting $ollama"
        Start-Process -FilePath $ollama.Source -ArgumentList 'serve' -WindowStyle Minimized
        if (Wait-For $ModelPort 60 'Ollama') {
            Say "  up on port $ModelPort"
            $modelCount = Wait-ForModels 120
            if ($modelCount -gt 0) {
                Say "  serving $modelCount local model(s)"
            } else {
                Say '  ! the model runtime is up but has not listed any models'
            }
        }
    }
}

# 2. Agent Bridge.
Say ''
Say '2. Agent Bridge'
if (Port-Listening $BridgePort) {
    Say "  already running on port $BridgePort"
} else {
    if (-not (Test-Path (Join-Path $BridgeRoot 'service.py'))) {
        Say "  ! there is no service.py in $BridgeRoot"
        return
    }
    Say "  starting the bridge on port $BridgePort"
    Say "  with the IDE origin allowed, and the IDE workspace as its root"
    $arguments = @(
        'service.py',
        '--port', "$BridgePort",
        '--cors-origin', "http://127.0.0.1:$IdePort",
        '--root', $IdeWorkspace
    )
    Start-Process -FilePath 'python' -ArgumentList $arguments -WorkingDirectory $BridgeRoot -WindowStyle Minimized -PassThru |
        ForEach-Object { $bridgeProcess = $_ }
    if (Wait-For $BridgePort 60 'Agent Bridge' $bridgeProcess) {
        Say "  up on port $BridgePort"
    }
}

# 3. The IDE.
Say ''
Say '3. The Aetherius IDE'
if (Port-Listening $IdePort) {
    Say "  already running on port $IdePort"
} else {
    if (-not (Test-Path (Join-Path $IdeApp 'package.json'))) {
        Say "  ! there is no package.json in $IdeApp"
        return
    }
    Say "  starting the development server on port $IdePort"
    Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev') -WorkingDirectory $IdeApp -WindowStyle Minimized -PassThru |
        ForEach-Object { $ideProcess = $_ }
    if (Wait-For $IdePort 90 'the IDE' $ideProcess) {
        Say "  up on port $IdePort"
    }
}

# 4. What is actually true.
Say ''
Say '4. What is actually true'
Start-Sleep -Seconds 2
try {
    $runtime = Invoke-RestMethod -Uri "http://127.0.0.1:$BridgePort/v1/runtime" -TimeoutSec 15
    Say "  the Bridge health is $($runtime.health)"
    Say "  the Bridge sees $(@($runtime.models).Count) local model(s)"
    if (@($runtime.models).Count -gt 0) {
        foreach ($model in @($runtime.models) | Select-Object -First 8) {
            Say "    $($model.name)"
        }
    } else {
        Say '    no models: the local model runtime has nothing, or it is down'
    }
} catch {
    Say "  the Bridge did not answer: $($_.Exception.Message)"
}
try {
    $ide = Invoke-WebRequest -Uri "http://127.0.0.1:$IdePort/" -TimeoutSec 15 -UseBasicParsing
    Say "  the IDE answers with HTTP $($ide.StatusCode)"
} catch {
    Say "  the IDE did not answer: $($_.Exception.Message)"
}

Say ''
Say "Open the IDE at  http://127.0.0.1:$IdePort"
Say 'The AI panel should read "backend: connected" and the ModelCenter should list the local models.'
Say ''
