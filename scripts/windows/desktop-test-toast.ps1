# Fixed synthetic payload, invoked only by the one-shot local Node sender.
# No registry/permission changes, modules, activation links, accounts or network calls.
$ErrorActionPreference = 'Stop'
$showStarted = $false
try {
    $request = [Console]::In.ReadToEnd() | ConvertFrom-Json
    $keys = @($request.PSObject.Properties.Name)
    if ($keys.Count -ne 4 -or @('appId','code','tag','expiresAt' | Where-Object { $_ -notin $keys }).Count -gt 0) { throw 'INVALID_FIXED_PAYLOAD' }
    if ($request.appId -notmatch '^[A-Za-z0-9._!\-]{1,180}$' -or $request.code -notmatch '^\d{6}$' -or $request.tag -notmatch '^[a-f0-9]{16}$') { throw 'INVALID_FIXED_PAYLOAD' }
    $registered = @(Get-StartApps | Where-Object { $_.AppID -ceq $request.appId })
    if ($registered.Count -eq 0) {
        @{outcome='FAILED';errorCode='APP_ID_NOT_REGISTERED'} | ConvertTo-Json -Compress
        exit 0
    }
    $expiry = [DateTimeOffset]::Parse($request.expiresAt, [Globalization.CultureInfo]::InvariantCulture)
    if ($expiry -le [DateTimeOffset]::UtcNow) {
        @{outcome='FAILED';errorCode='TEST_EXPIRED'} | ConvertTo-Json -Compress
        exit 0
    }
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($request.appId)
    if ($notifier.Setting.ToString() -ne 'Enabled') {
        @{outcome='FAILED';errorCode='WINDOWS_NOTIFICATIONS_DISABLED'} | ConvertTo-Json -Compress
        exit 0
    }
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml('<toast><visual><binding template="ToastGeneric"><text>SwingPilot AI - TEST ONLY</text><text></text></binding></visual></toast>')
    $xml.GetElementsByTagName('text').Item(1).InnerText = 'Test code: ' + $request.code + '. Enter it in the local SwingPilot desktop-test page.'
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    $toast.Tag = $request.tag
    $toast.Group = 'SwingPilotTests'
    $toast.ExpirationTime = $expiry
    $showStarted = $true
    $notifier.Show($toast)
    @{outcome='ACCEPTED';errorCode=$null} | ConvertTo-Json -Compress
} catch {
    # A failure after Show starts is ambiguous: never automatically resend.
    if ($showStarted) { @{outcome='UNKNOWN';errorCode='WINDOWS_SEND_AMBIGUOUS'} | ConvertTo-Json -Compress }
    else { @{outcome='FAILED';errorCode='WINDOWS_ADAPTER_UNAVAILABLE'} | ConvertTo-Json -Compress }
}
