# Read-only Windows inventory. No installs, network calls, schedules or notifications.
# Run from this repository in Windows PowerShell 5.1 or PowerShell 7.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ToolPresence([string]$Name) {
    $Found = Get-Command -Name $Name -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    # Presence is not proof that a program works. Do not invoke user PATH executables.
    return [ordered]@{ available = ($null -ne $Found); version = 'NOT_PROBED' }
}

if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
    throw 'This check is for Windows. Use preflight.py --environment cloud on Linux.'
}

$Tools = [ordered]@{}
foreach ($Name in @('node', 'npm', 'psql', 'pg_dump', 'codex', 'py', 'python', 'git')) {
    $Tools[$Name] = Get-ToolPresence $Name
}

$Storage = @()
try {
    $Storage = @(Get-CimInstance Win32_LogicalDisk | Where-Object {
        $_.DriveType -eq 2 -or $_.DriveType -eq 3
    } | ForEach-Object {
        [ordered]@{
            type = $(if ($_.DriveType -eq 2) { 'REMOVABLE_REPORTED' } else { 'LOCAL_REPORTED' })
            capacity_gib = [math]::Round($_.Size / 1GB, 1)
            free_gib = [math]::Round($_.FreeSpace / 1GB, 1)
            separate_backup_verified = $false
        }
    })
} catch {
    # Avoid exporting raw errors containing machine/user identifiers.
    $Storage = @([ordered]@{ probe = 'UNAVAILABLE' })
}

[ordered]@{
    schema_version = 1
    observed_at = [DateTimeOffset]::UtcNow.ToString('o')
    environment_declared_by_operator = 'desktop'
    target_desktop_verified = $false
    host = [ordered]@{
        os = 'Windows'
        version = [Environment]::OSVersion.Version.ToString()
        powershell = $PSVersionTable.PSVersion.ToString()
        interactive_process = [Environment]::UserInteractive
    }
    tools = $Tools
    storage = $Storage
    subscription = [ordered]@{
        tier = 'PLUS_USER_REPORTED'
        remaining_allowance = 'UNKNOWN'
        credit_spending_disabled = 'UNVERIFIED'
    }
    desktop_display = 'UNRUN_REQUIRES_ACTUAL_OS_RECEIPT'
    backup_restore = 'UNRUN_REQUIRES_SEPARATE_MEDIUM'
    native_bridge = 'UNRUN'
    unattended_dispatch = 'UNRUN'
    overall = 'INCOMPLETE_NOT_A_RELEASE_GATE_PASS'
} | ConvertTo-Json -Depth 8
