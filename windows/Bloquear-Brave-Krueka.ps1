# Krueka - bloquear Internet en Brave en equipos BEI, manteniendo Office y Edge
# Windows 10/11. Comprobar sin alterar; Aplicar requiere Administrador.
[CmdletBinding()]
param([ValidateSet("Comprobar","Aplicar")][string]$Modo="Comprobar")
$ErrorActionPreference="Stop"
$policyKey="HKLM:\SOFTWARE\Policies\BraveSoftware\Brave\URLBlocklist"
$baseKey="HKLM:\SOFTWARE\Policies\BraveSoftware\Brave"
$backupDir=Join-Path $env:ProgramData "Krueka\Respaldo-Politicas"
$paths=New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
function AddBrave([string]$p) {
 if(![string]::IsNullOrWhiteSpace($p) -and [IO.Path]::GetFileName($p) -ieq "brave.exe" -and
   (Test-Path -LiteralPath $p -PathType Leaf)) {[void]$paths.Add([IO.Path]::GetFullPath($p))}
}
@($env:ProgramFiles,$env:ProgramW6432,[Environment]::GetEnvironmentVariable("ProgramFiles(x86)")) |
 Where-Object { $_ } | ForEach-Object {
 AddBrave (Join-Path $_ "BraveSoftware\Brave-Browser\Application\brave.exe")
}
if($env:LOCALAPPDATA) {
 AddBrave (Join-Path $env:LOCALAPPDATA "BraveSoftware\Brave-Browser\Application\brave.exe")
}
$usersRoot=Join-Path $env:SystemDrive "Users"
if(Test-Path -LiteralPath $usersRoot) {
 Get-ChildItem -LiteralPath $usersRoot -Directory -Force -ErrorAction SilentlyContinue |
  ForEach-Object { AddBrave (Join-Path $_.FullName "AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe") }
}
try {
 Get-CimInstance Win32_Process -Filter "Name='brave.exe'" -ErrorAction Stop | ForEach-Object {
  if($_.ExecutablePath){AddBrave $_.ExecutablePath}
 }
} catch { Write-Warning "No se pudo consultar la ruta de los procesos Brave activos." }

function RuleName([string]$exe){
 $sha=[Security.Cryptography.SHA256]::Create()
 try {$hash=$sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($exe.ToLowerInvariant()))}
 finally {$sha.Dispose()}
 return "Krueka_Brave_"+(([BitConverter]::ToString($hash)).Replace("-","").Substring(0,16))
}
function RuleValid([string]$exe){
 $r=Get-NetFirewallRule -Name (RuleName $exe) -ErrorAction SilentlyContinue
 if(!$r -or [string]$r.Enabled -ne "True" -or [string]$r.Action -ne "Block" -or [string]$r.Direction -ne "Outbound"){return $false}
 $filter=$r|Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue
 return !!($filter -and $filter.Program -ieq $exe)
}
function PolicyHasBlock(){
 if(!(Test-Path -LiteralPath $policyKey)){return $false}
 $key=Get-Item -LiteralPath $policyKey
 foreach($n in $key.GetValueNames()){if([string]$key.GetValue($n) -eq "*"){return $true}}
 return $false
}
$admin=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if($Modo -eq "Aplicar"){
 if(!$admin){throw "Debes ejecutar este programa como administrador de Windows."}
 if(!(Get-Command New-NetFirewallRule -ErrorAction SilentlyContinue)){throw "Windows no tiene disponible NetSecurity."}
 New-Item -ItemType Directory -Path $backupDir -Force|Out-Null
 if(Test-Path -LiteralPath $baseKey){
  $back=Join-Path $backupDir ("Brave-antes-"+(Get-Date -Format "yyyyMMdd-HHmmss")+".reg")
  & reg.exe export "HKLM\SOFTWARE\Policies\BraveSoftware\Brave" "$back" /y | Out-Null
  if($LASTEXITCODE -ne 0){throw "No se pudo respaldar la politica. Sin cambios."}
  Write-Host "Respaldo de politicas: $back"
 }
 if(!(Test-Path -LiteralPath $policyKey)){New-Item -Path $policyKey -Force|Out-Null}
 if(!(PolicyHasBlock)){
  $key=Get-Item -LiteralPath $policyKey
  $numbers=@($key.GetValueNames()|Where-Object {$_ -match '^\d+$'}|ForEach-Object {[int]$_})
  $index=1
  if($numbers.Count){$index=([int](($numbers|Measure-Object -Maximum).Maximum))+1}
  New-ItemProperty -LiteralPath $policyKey -Name ([string]$index) -Value "*" -PropertyType String -Force|Out-Null
 }
 foreach($exe in $paths){
  if(!(RuleValid $exe)){
   $old=Get-NetFirewallRule -Name (RuleName $exe) -ErrorAction SilentlyContinue
   if($old){$old|Remove-NetFirewallRule}
   New-NetFirewallRule -Name (RuleName $exe) -DisplayName "Krueka - Brave sin Internet" -Group "Krueka - Proteccion Brave" -Direction Outbound -Action Block -Enabled True -Profile Any -Program $exe -Protocol Any -Description "Brave bloqueado; Office y Edge no se modifican."|Out-Null
  }
 }
}
$policy=PolicyHasBlock
$firewallOff=@(Get-NetFirewallProfile | Where-Object {$_.Enabled -eq $false} | Select-Object -ExpandProperty Name)
Write-Host ""
Write-Host "KRUEKA - COMPROBACION DE BRAVE" -ForegroundColor Cyan
Write-Host ("Equipo: "+$env:COMPUTERNAME)
Write-Host ("Modo: "+$Modo)
Write-Host ("Politica de URLs bloqueadas (*): "+$(if($policy){"SI"}else{"NO"}))
if($firewallOff.Count){Write-Warning ("Firewall desactivado en perfiles: "+($firewallOff -join ", "))}
if(!$paths.Count){Write-Warning "No se encontro Brave en rutas habituales ni como proceso. Una copia portable no abierta podria estar fuera de alcance."}
$allRules=$true
foreach($exe in $paths){
 $ok=RuleValid $exe
 if(!$ok){$allRules=$false}
 Write-Host ("Brave: "+$exe)
 Write-Host ("  Bloqueo de red: "+$(if($ok){"INSTALADO"}else{"AUSENTE"}))
}
if($policy -and $allRules -and !$firewallOff.Count -and $paths.Count){
 Write-Host "Politica y reglas instaladas para las rutas encontradas." -ForegroundColor Green
 Write-Host "Cierra Brave, vuelve a abrirlo e intenta una pagina NUEVA no almacenada en cache." -ForegroundColor Yellow
}else{
 Write-Warning "La proteccion NO esta confirmada. Aplica como administrador y prueba con una pagina nueva."
}
Write-Host "No se modificaron Edge, Office ni las restricciones de otros navegadores."
Write-Host "Este resultado local no se envia automaticamente al panel remoto."
