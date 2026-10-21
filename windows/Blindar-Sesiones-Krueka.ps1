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
# Un usuario alternativo puede abrir Firefox/Opera/Vivaldi en lugar de Edge.
# Reglas de firewall por ruta (HKLM para todos los usuarios); no se tocan Office ni Edge.
function OtrasRutas {
 $paths=New-Object "System.Collections.Generic.HashSet[string]" ([StringComparer]::OrdinalIgnoreCase)
 $known=@(
  "Mozilla Firefox\firefox.exe","Vivaldi\Application\vivaldi.exe",
  "Opera\opera.exe","Opera\launcher.exe","Opera GX\launcher.exe",
  "Programs\Opera\opera.exe","Programs\Opera\launcher.exe",
  "Programs\Opera GX\launcher.exe","Programs\Vivaldi\Application\vivaldi.exe"
 )
 $roots=@($env:ProgramFiles,$env:ProgramW6432,[Environment]::GetEnvironmentVariable("ProgramFiles(x86)"))
 if($env:LOCALAPPDATA){$roots+=@($env:LOCALAPPDATA)}
 $users=Join-Path $env:SystemDrive "Users"
 if(Test-Path -LiteralPath $users){
  foreach($folder in @(Get-ChildItem -LiteralPath $users -Directory -Force -ErrorAction SilentlyContinue)){
   $roots+=@(Join-Path $folder.FullName "AppData\Local")
  }
 }
 foreach($root in @($roots|Where-Object{$_}|Select-Object -Unique)){
  foreach($relative in $known){
   $file=Join-Path $root $relative
   if(Test-Path -LiteralPath $file -PathType Leaf){[void]$paths.Add([IO.Path]::GetFullPath($file))}
  }
 }
 try{
  foreach($proc in @(Get-CimInstance Win32_Process -ErrorAction Stop |
    Where-Object{$_.Name -in @("firefox.exe","opera.exe","launcher.exe","vivaldi.exe","chromium.exe","waterfox.exe","palemoon.exe")})){
   if($proc.Name -eq "launcher.exe" -and $proc.ExecutablePath -notmatch "(?i)\\Opera"){continue}
   if($proc.ExecutablePath -and (Test-Path -LiteralPath $proc.ExecutablePath -PathType Leaf)){
    [void]$paths.Add([IO.Path]::GetFullPath($proc.ExecutablePath))
   }
  }
 }catch{Write-Warning "No se pudieron revisar procesos de navegadores alternativos."}
 foreach($item in $paths){Write-Output $item}
}
function BrowserRuleName([string]$exe){
 $sha=[Security.Cryptography.SHA256]::Create()
 try{$hash=$sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($exe.ToLowerInvariant()))}
 finally{$sha.Dispose()}
 return "Krueka_OtroNavegador_"+([BitConverter]::ToString($hash)).Replace("-","").Substring(0,16)
}
function RuleInstalled([string]$exe){
 $r=Get-NetFirewallRule -Name (BrowserRuleName $exe) -ErrorAction SilentlyContinue
 if(!$r -or [string]$r.Enabled -ne "True" -or [string]$r.Action -ne "Block" -or [string]$r.Direction -ne "Outbound"){return $false}
 $filter=$r|Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue
 return !!($filter -and $filter.Program -ieq $exe)
}
function Respaldo([string]$reg,[string]$name){
 $check=$reg -replace '^HKLM\\','HKLM:\\'
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
 $alts=@(OtrasRutas)
 Write-Host ("Navegadores alternativos localizados: "+$alts.Count)
 foreach($exe in $alts){Write-Host ("  "+$exe+" -> salida bloqueada: "+$(if(RuleInstalled $exe){"SI"}else{"NO"}))}
 $off=@(Get-NetFirewallProfile | Where-Object {$_.Enabled -eq $false} | Select-Object -ExpandProperty Name)
 if($off.Count){Write-Warning ("Firewall apagado: "+($off -join ", ")+". Las reglas NO seran eficaces.")}
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
 if(!(Get-Command New-NetFirewallRule -ErrorAction SilentlyContinue)){throw "No se encontro NetSecurity."}
 foreach($exe in @(OtrasRutas)){
  if(!(RuleInstalled $exe)){
   $name=BrowserRuleName $exe
   $existing=Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
   if($existing){$existing|Remove-NetFirewallRule}
   New-NetFirewallRule -Name $name -DisplayName "Krueka - navegador alternativo sin red" -Group "Krueka - Bloqueos aula" -Direction Outbound -Action Block -Enabled True -Profile Any -Protocol Any -Program $exe|Out-Null
  }
 }
 & $brave -Modo Aplicar
 if(!$?){throw "No se pudo aplicar el bloqueo Brave. Revisar su salida."}
 Write-Host "Directivas de equipo aplicadas. Reiniciar sesion para comprobar." -ForegroundColor Green
}
Informe
Write-Host ""
Write-Host "PRUEBAS: Edge debe abrir Krueka, pero no sitios externos no autorizados."
Write-Host "Brave, Firefox, Opera y Vivaldi detectados no deben navegar. Probar URL nueva."
Write-Host "Cerrar sesion y repetir con OTRA CUENTA ESTANDAR. Si navega, bloqueo NO confirmado."
Write-Host "No se modificaron cuentas, contrasenas, Office, quiosco ni permisos de archivos."
Write-Host "Apps portables no detectadas requieren controles adicionales (Assigned Access/AppLocker/WDAC)."
