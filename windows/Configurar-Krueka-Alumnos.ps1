# Krueka - Configuracion de PCs del aula (Windows 10/11)
# Ejecutar como administrador desde INSTALAR-COMO-ADMINISTRADOR.cmd
# Mantiene la lista de sitios bloqueados y los programas de Office.
# Solo agrega excepciones necesarias y accesos a la actividad.
#requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$pagina = 'https://www.krueka.com/actividades-clase.html'
$edge = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'
$permitidos = @(
  'https://www.krueka.com',
  'https://krueka.com',
  'https://janebfpnknapvntfqolf.supabase.co',
  'https://cdn.jsdelivr.net',
  'https://challenges.cloudflare.com'
)
function CrearClave([string]$ruta) {
  if (-not (Test-Path -LiteralPath $ruta)) {
    New-Item -Path $ruta -Force | Out-Null
  }
}
function GuardarAcceso([string]$ruta, [string]$edgeExe, [string]$pagina) {
  $carpeta = Split-Path $ruta -Parent
  if (-not (Test-Path -LiteralPath $carpeta)) {
    New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
  }
  $shell = New-Object -ComObject WScript.Shell
  $acceso = $shell.CreateShortcut($ruta)
  $acceso.TargetPath = $edgeExe
  $acceso.Arguments = '--new-window "' + $pagina + '"'
  $acceso.WorkingDirectory = Split-Path $edgeExe -Parent
  $acceso.Description = 'Ingresar el codigo de clase de Krueka'
  $acceso.IconLocation = "$edgeExe,0"
  $acceso.Save()
}

Write-Host 'KRUEKA - Configurando acceso de alumnos...' -ForegroundColor Cyan
$backupDir = Join-Path $env:ProgramData 'Krueka\Respaldo-Politicas'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
if (Test-Path -LiteralPath $edge) {
  $respaldo = Join-Path $backupDir ("Edge-antes-de-Krueka-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.reg')
  & reg.exe export 'HKLM\SOFTWARE\Policies\Microsoft\Edge' $respaldo /y | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo respaldar la configuracion anterior de Edge.' }
  Write-Host "Respaldo: $respaldo"
}
CrearClave $edge
$allowKey = Join-Path $edge 'URLAllowlist'
CrearClave $allowKey
$allow = Get-Item -LiteralPath $allowKey
$nombres = @($allow.GetValueNames())
$valores = @($nombres | ForEach-Object { [string]$allow.GetValue($_) })
$numeros = @($nombres | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ })
$siguiente = 1
if ($numeros.Count -gt 0) {
  $siguiente = [int](($numeros | Measure-Object -Maximum).Maximum) + 1
}
foreach ($dominio in $permitidos) {
  if ($valores -notcontains $dominio) {
    New-ItemProperty -LiteralPath $allowKey -Name ([string]$siguiente) -Value $dominio -PropertyType String -Force | Out-Null
    Write-Host "Permitido: $dominio"
    $siguiente++
  }
}

# Pagina inicial de Edge. Conservar otras URLs existentes y anteponer Krueka.
$urlsKey = Join-Path $edge 'RestoreOnStartupURLs'
CrearClave $urlsKey
$urlsReg = Get-Item -LiteralPath $urlsKey
$urlsAnteriores = @($urlsReg.GetValueNames() | Sort-Object { if ($_ -match '^\d+$') {[int]$_} else {999999} } | ForEach-Object { [string]$urlsReg.GetValue($_) })
$urlsFinales = @($pagina) + @($urlsAnteriores | Where-Object { $_ -and $_ -ne $pagina })
foreach ($nombre in @($urlsReg.GetValueNames())) {
  Remove-ItemProperty -LiteralPath $urlsKey -Name $nombre -ErrorAction Stop
}
for ($i=0; $i -lt $urlsFinales.Count; $i++) {
  New-ItemProperty -LiteralPath $urlsKey -Name ([string]($i+1)) -Value $urlsFinales[$i] -PropertyType String -Force | Out-Null
}
New-ItemProperty -LiteralPath $edge -Name 'RestoreOnStartup' -Value 4 -PropertyType DWord -Force | Out-Null
New-ItemProperty -LiteralPath $edge -Name 'HomepageLocation' -Value $pagina -PropertyType String -Force | Out-Null
New-ItemProperty -LiteralPath $edge -Name 'HomepageIsNewTabPage' -Value 0 -PropertyType DWord -Force | Out-Null

# Ruta habitual de Edge, sin instalar programas nuevos.
$rutasEdge = @(
  (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
  (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe')
)
$edgeExe = $rutasEdge | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $edgeExe) {
  $registroExe = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe' -ErrorAction SilentlyContinue
  if ($registroExe) { $edgeExe = $registroExe.'(default)' }
}
if (-not $edgeExe -or -not (Test-Path -LiteralPath $edgeExe)) {
  throw 'Microsoft Edge no fue localizado. Las excepciones ya estan configuradas; instale o repare Edge para crear los accesos.'
}
$inicioGeneral = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\Startup\Krueka - Actividades de clase.lnk'
$escritorioGeneral = Join-Path $env:PUBLIC 'Desktop\Krueka - Actividades de clase.lnk'
GuardarAcceso $inicioGeneral $edgeExe $pagina
GuardarAcceso $escritorioGeneral $edgeExe $pagina

Write-Host ''
Write-Host 'CONFIGURACION GUARDADA.' -ForegroundColor Green
Write-Host '1. Reiniciar Edge. Al iniciar sesion en Windows se abrira Krueka.'
Write-Host '2. Entrar en edge://policy y pulsar Recargar directivas.'
Write-Host '3. Probar codigo de clase, vista previa del PDF y entrega de archivos.'
Write-Host '4. Si una politica central o el kiosco impone otros bloqueos, actualizarlos tambien desde el administrador.'
Write-Host 'Los bloqueos previos de Internet y las restricciones de Office no se han eliminado.'
