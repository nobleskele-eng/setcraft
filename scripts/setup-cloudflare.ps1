[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ConfigPath = Join-Path $ProjectRoot "wrangler.jsonc"
$DatabaseName = "lanelab-production"
$MinimumNode = [Version]"22.13.0"

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Invoke-NpxChecked([string[]]$ArgumentList) {
  & npx.cmd @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: npx $($ArgumentList -join ' ')"
  }
}

function Get-D1Databases {
  $JsonLines = & npx.cmd wrangler d1 list --json
  if ($LASTEXITCODE -ne 0) {
    throw "Could not list Cloudflare D1 databases."
  }
  $Json = $JsonLines -join "`n"
  if ([string]::IsNullOrWhiteSpace($Json)) {
    return @()
  }
  return @($Json | ConvertFrom-Json)
}

function Update-D1Binding([string]$DatabaseId) {
  $Config = [IO.File]::ReadAllText($ConfigPath)
  $Pattern = '("database_id"\s*:\s*")[^"]+("\s*)'
  $DatabaseIdPattern = New-Object Regex($Pattern)
  $Updated = $DatabaseIdPattern.Replace(
    $Config,
    { param($Match) $Match.Groups[1].Value + $DatabaseId + $Match.Groups[2].Value },
    1
  )
  if ($Updated -eq $Config -and $Config -notmatch [Regex]::Escape($DatabaseId)) {
    throw "Could not update the DB binding in wrangler.jsonc."
  }
  $Utf8NoBom = New-Object Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($ConfigPath, $Updated, $Utf8NoBom)
}

function Ask-YesNo([string]$Prompt, [bool]$DefaultYes = $false) {
  $Suffix = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
  $Answer = (Read-Host "$Prompt $Suffix").Trim().ToLowerInvariant()
  if (-not $Answer) { return $DefaultYes }
  return $Answer -in @("y", "yes")
}

Push-Location $ProjectRoot
try {
  Write-Host "LaneLab Cloudflare production setup" -ForegroundColor Green
  Write-Host "This wizard creates the D1 login database, applies migrations, stores optional API keys as encrypted Worker secrets, and deploys lanelab.studio."

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is not installed." }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is not installed." }
  if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) { throw "npx is not available." }

  $NodeVersionText = (& node --version).Trim().TrimStart("v")
  $NodeVersion = [Version]$NodeVersionText
  if ($NodeVersion -lt $MinimumNode) {
    throw "LaneLab requires Node.js $MinimumNode or newer. Installed: $NodeVersion"
  }

  if (-not $SkipInstall) {
    Write-Step "Installing exact package versions"
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
  }

  Write-Step "Checking the release package"
  & npm.cmd run release:validate
  if ($LASTEXITCODE -ne 0) { throw "Release validation failed." }

  Write-Step "Connecting to Cloudflare"
  & npx.cmd wrangler whoami
  if ($LASTEXITCODE -ne 0) {
    Invoke-NpxChecked @("wrangler", "login")
  }

  Write-Step "Preparing the D1 account database"
  $Database = Get-D1Databases | Where-Object { $_.name -eq $DatabaseName } | Select-Object -First 1
  if (-not $Database) {
    Invoke-NpxChecked @("wrangler", "d1", "create", $DatabaseName, "--location", "enam")
    $Database = Get-D1Databases | Where-Object { $_.name -eq $DatabaseName } | Select-Object -First 1
  }
  if (-not $Database) { throw "The D1 database could not be created or found." }
  $DatabaseId = if ($Database.PSObject.Properties.Name -contains "uuid") {
    [string]$Database.uuid
  } elseif ($Database.PSObject.Properties.Name -contains "id") {
    [string]$Database.id
  } else {
    ""
  }
  if (-not $DatabaseId) { throw "Cloudflare did not return a D1 database ID." }
  Update-D1Binding $DatabaseId
  Write-Host "D1 ready: $DatabaseName ($DatabaseId)" -ForegroundColor Green

  Write-Step "Applying login and password-reset migrations"
  Invoke-NpxChecked @("wrangler", "d1", "migrations", "apply", "DB", "--remote")

  Write-Step "Optional server-side services"
  if (Ask-YesNo "Configure the Gemini API key now?" $true) {
    Write-Host "Wrangler will hide the value while you type."
    Invoke-NpxChecked @("wrangler", "secret", "put", "GEMINI_API_KEY")
    if (Ask-YesNo "Do you already have a Gemini File Search store to add?" $false) {
      Invoke-NpxChecked @("wrangler", "secret", "put", "GEMINI_FILE_SEARCH_STORE")
    }
  } else {
    Write-Host "Gemini skipped. LaneLab will use its offline coaching fallback."
  }

  if (Ask-YesNo "Configure Resend for password-reset emails now?" $false) {
    Write-Host "Verify lanelab.studio in Resend before using noreply@lanelab.studio."
    Invoke-NpxChecked @("wrangler", "secret", "put", "RESEND_API_KEY")
  } else {
    Write-Host "Resend skipped. Forgot-password remains privacy-safe but will not send email until this secret is added."
  }

  if (-not $SkipDeploy) {
    Write-Step "Final DNS check"
    Write-Host "Cloudflare must show lanelab.studio as Active. Delete the old Porkbun parking A records and the pixie.porkbun.com CNAME records for @, www, and * before continuing."
    if (-not (Ask-YesNo "Are those DNS steps complete?" $true)) {
      throw "Deployment paused so you can finish the DNS cleanup. Re-run this script afterward."
    }

    Write-Step "Building and deploying LaneLab"
    & npm.cmd run deploy:cloudflare
    if ($LASTEXITCODE -ne 0) { throw "Cloudflare deployment failed." }

    Write-Host "`nLaneLab is deployed. Open https://lanelab.studio and create the first account." -ForegroundColor Green
  } else {
    Write-Host "`nSetup is complete. Run npm run deploy:cloudflare when DNS is ready." -ForegroundColor Green
  }
}
finally {
  Pop-Location
}
