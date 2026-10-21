# Krueka: proteger navegadores en todas las cuentas de Windows.
# Comprobar: lectura. Aplicar: cambios HKLM para TODAS las sesiones del equipo.
[CmdletBinding()]
param([ValidateSet("Comprobar","Aplicar")][string]$Modo="Comprobar")
$ErrorActionPreference="Stop"
$backup=Join-Path $env:ProgramData "Krueka\Respaldo-Politicas"
$fast="HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System"
$sites=@("https://www.krueka.com/*","https://krueka.com/*",
 "https://janebfpnknapvntfqolf.supabase.co/*","https://cdn.jsdelivr.net/*",
 "https://challenges.cloudflare.com/*","http://127.0.0.1:47821/*")
function EsAdmin {
 $user=[Security.Principal.WindowsIdentity]::GetCurrent()
 return ([Security.Principal.WindowsPrincipal]::new($user)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function Valores($path) {
 if(!(Test-Path -LiteralPath $path)){return @()}
 $k=Get-Item -LiteralPath $path
 return @($k.GetValueNames()|ForEach-Object{[string]$k.GetValue($_)})
}
function AgregarValores($path,[string[]]$entries){
 if(!(Test-Path -LiteralPath $path)){New-Item -Path $path -Force|Out-Null}
 $key=Get-Item -LiteralPath $path
 $names=@($key.GetValueNames())
 $present=@($names|ForEach-Object{[string]$key.GetValue($_)})
 $numbers=@($names|Where-Object{$_ -match '^\d+$'}|ForEach-Object{[int]$_})
 $next=1
 if($numbers.Count){$next=([int](($numbers|Measure-Object -Maximum).Maximum))+1}
 foreach($entry in $entries){
  if($present -notcontains $entry){
   New-ItemProperty -LiteralPath $path -Name ([string]$next) -Value $entry -PropertyType String -Force|Out-Null
   $next++
  }
 }
}
function Respaldo([string]$reg,[string]$name){
 $check="Registry::"+$reg
 if(Test-Path -LiteralPath $check){
  $dest=Join-Path $backup ($name+"-"+(Get-Date -Format "yyyyMMdd-HHmmss")+".reg")
  & reg.exe export "$reg" "$dest" /y|Out-Null
  if($LASTEXITCODE -ne 0){throw "No se pudo respaldar $reg. Se interrumpio la instalacion."}
  Write-Host ("Respaldo: "+$dest)
 }
}
function Informe {
 Write-Host ""
 Write-Host "KRUEKA - SEGURIDAD ENTRE CUENTAS WINDOWS" -ForegroundColor Cyan
 Write-Host ("PC: "+$env:COMPUTERNAME+"; modo: "+$Modo)
 $setting=(Get-ItemProperty -LiteralPath $fast -Name HideFastUserSwitching -ErrorAction SilentlyContinue).HideFastUserSwitching
 Write-Host ("Ocultar Cambiar usuario: "+$(if($setting -eq 1){"SI"}else{"NO"}))
 foreach($item in @(@("Edge","HKLM:\SOFTWARE\Policies\Microsoft\Edge"),@("Chrome","HKLM:\SOFTWARE\Policies\Google\Chrome"))){
  $blocked=Valores (Join-Path $item[1] "URLBlocklist")
  $exceptions=Valores (Join-Path $item[1] "URLAllowlist")
  $missing=@($sites|Where-Object{$exceptions -notcontains $_})
  Write-Host ($item[0]+": bloqueo general "+$(if($blocked -contains "*"){"SI"}else{"NO"})+
   ", excepciones faltantes: "+$missing.Count)
  if($exceptions.Count -gt $sites.Count){
   Write-Warning ($item[0]+": hay permisos URL anteriores adicionales; revisarlos en el navegador.")
  }
 }
 Write-Host "CUENTAS LOCALES:" -ForegroundColor Cyan
 try{
  $adminIds=@(Get-LocalGroupMember -SID ([Security.Principal.SecurityIdentifier]::new("S-1-5-32-544")) -ErrorAction Stop|ForEach-Object{$_.SID.Value})
  foreach($user in @(Get-LocalUser)){
   $isAdmin=$adminIds -contains $user.SID.Value
   Write-Host ("  "+$user.Name+" - "+$(if($user.Enabled){"Habilitada"}else{"Deshabilitada"})+
    " - "+$(if($isAdmin){"ADMINISTRADOR"}else{"Estandar"}))
   if($user.Enabled -and $isAdmin){Write-Warning ("Proteger con contrasena exclusiva: "+$user.Name)}
  }
 }catch{Write-Warning ("No se pudo listar cuentas: "+$_.Exception.Message)}
 try{
  $win=Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
  if($win.AutoAdminLogon -eq "1"){Write-Warning "Inicio automatico activo. Verificar que NO utilice una cuenta administradora."}
 }catch{}
 Write-Host "IMPORTANTE: ocultar Cambiar usuario NO impide cerrar sesion y entrar con otra cuenta."
 Write-Host "Mantener alumnos como usuarios ESTANDAR; la cuenta administradora debe tener contrasena privada."
 Write-Host "En Windows Pro/Education: configurar Assigned Access multiapp para TODOS los alumnos."
}
if($Modo -eq "Aplicar"){
 if(!(EsAdmin)){throw "Ejecutar con permisos de administrador de Windows."}
 $brave=Join-Path $PSScriptRoot "Bloquear-Brave-Krueka.ps1"
 if(!(Test-Path -LiteralPath $brave)){throw "Falta Bloquear-Brave-Krueka.ps1 junto al script. No hubo cambios."}
 New-Item -ItemType Directory -Path $backup -Force|Out-Null
 Respaldo "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" "Sistema"
 Respaldo "HKLM\SOFTWARE\Policies\Microsoft\Edge" "Edge"
 Respaldo "HKLM\SOFTWARE\Policies\Google\Chrome" "Chrome"
 if(!(Test-Path -LiteralPath $fast)){New-Item -Path $fast -Force|Out-Null}
 New-ItemProperty -LiteralPath $fast -Name "HideFastUserSwitching" -Value 1 -PropertyType DWord -Force|Out-Null
 foreach($base in @("HKLM:\SOFTWARE\Policies\Microsoft\Edge","HKLM:\SOFTWARE\Policies\Google\Chrome")){
  AgregarValores (Join-Path $base "URLBlocklist") @("*")
  AgregarValores (Join-Path $base "URLAllowlist") $sites
 }
 & $brave -Modo Aplicar
 if(!$?){throw "No se pudo aplicar el bloqueo Brave. Revisar su salida."}
 Write-Host "Directivas de equipo aplicadas. Reiniciar sesion para comprobar." -ForegroundColor Green
}
Informe
Write-Host ""
Write-Host "PRUEBAS: Edge debe abrir Krueka, pero no sitios externos no autorizados."
Write-Host "Brave no debe navegar. Probar una URL nueva, no cacheada."
Write-Host "Cerrar sesion y repetir con OTRA CUENTA ESTANDAR. Si navega, bloqueo NO confirmado."
Write-Host "No se modificaron cuentas, contrasenas, Office, quiosco ni permisos de archivos."
Write-Host "Las apps portables y otras cuentas siguen requiriendo control Assigned Access/AppLocker/WDAC."
