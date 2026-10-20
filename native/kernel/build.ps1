# Aetherius kernel build for Windows.
#
# The Makefile is the canonical build definition. GNU make's process
# spawning does not work reliably under PowerShell on this host, so this
# script does the same steps with Windows-correct directory handling. Both
# paths build the same artefact and run the same tests, so the test result
# means the same thing either way.
#
#   .\build.ps1            - build and run the host test suite
#   .\build.ps1 -Uefi      - also build the UEFI kernel image
#   .\build.ps1 -Clean     - remove the build tree
#
# The UEFI image needs gnu-efi. When it is not installed the script says
# so plainly and does not pretend the image was produced.

[CmdletBinding()]
param(
    [switch]$Uefi,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Build = Join-Path $Root 'build'

function Invoke-Checked {
    # $Args is a reserved automatic variable in PowerShell, so the
    # parameter cannot be called that: a splat of it is silently empty,
    # and the compiler is then invoked with no input files.
    param([string]$Exe, [string[]]$Arguments, [string]$What)
    & $Exe @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$What failed with exit code $LASTEXITCODE"
    }
}

if ($Clean) {
    if (Test-Path $Build) { Remove-Item $Build -Recurse -Force }
    Write-Host "removed $Build"
    exit 0
}

# -- locate the toolchain --------------------------------------------------
$cc = Get-Command gcc -ErrorAction SilentlyContinue
if (-not $cc) { $cc = Get-Command clang -ErrorAction SilentlyContinue }
if (-not $cc) { throw "no C compiler found (gcc or clang is required)" }
Write-Host "compiler: $($cc.Source)"

$compiler = $cc.Source

# -- host test suite -------------------------------------------------------
# One compile and link step. The host tests are ordinary programs, so they
# link libc; the kernel itself does not.
$hostSources = @(
    'tests/test_kernel.c',
    'arch/x86_64/gdt.c',
    'arch/x86_64/idt.c',
    'kernel/sched.c',
    'kernel/syscall.c'
) | ForEach-Object { Join-Path $Root $_ }

$hostDir = Join-Path $Build 'host'
New-Item -ItemType Directory -Force -Path $hostDir | Out-Null
$hostBin = Join-Path $hostDir 'test_kernel.exe'

$hostArgs = @(
    '-std=c11', '-Wall', '-Wextra', '-Werror', '-Wpedantic', '-Wshadow',
    '-Wno-unused-parameter', '-O1', '-g',
    '-I', (Join-Path $Root 'include')
) + $hostSources + @('-o', $hostBin)

Write-Host "building host tests..."
Invoke-Checked $compiler $hostArgs 'host test build'

Write-Host "running host tests..."
& $hostBin
if ($LASTEXITCODE -ne 0) { throw "host tests failed with exit code $LASTEXITCODE" }

# -- UEFI kernel image -----------------------------------------------------
if ($Uefi) {
    $gnuefi = Get-Command gnu-efi-gcc -ErrorAction SilentlyContinue
    if (-not $gnuefi) {
        Write-Warning @"
gnu-efi was not found, so the UEFI kernel image was NOT built.
Install gnu-efi (https://github.com/geneC/gnu-efi) and re-run with -Uefi.
This is reported rather than worked around: an unbuilt kernel image must
not be reported as a built one.
"@
    } else {
        Write-Host "building UEFI kernel image with $($gnuefi.Source)..."
        # The UEFI build is driven by the gnu-efi toolchain's own makefile
        # once the source is laid out under its expected paths.
        throw "UEFI image build is not wired up yet; see docs/SYSCALL-ABI.md"
    }
}

Write-Host "OK"
