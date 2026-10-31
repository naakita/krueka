# Krueka BEI — Diagnóstico de políticas efectivas para Edge/Chrome/Brave.
# Solo lectura. No modifica Registro, tareas, tokens, firewall ni el bloqueo general.
# Compatible con Windows PowerShell 5.1 y versiones actuales.
[CmdletBinding()]
param()
$ErrorActionPreference='Continue'
Write-Host 'KRUEKA - DIAGNÓSTICO DE BLOQUEOS WEB (SOLO LECTURA)' -ForegroundColor Cyan
Write-Host ('PC Windows: '+$env:COMPUTERNAME+' | Hora: '+(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
Write-Host 'Este análisis NO desbloquea ni instala nada. No muestra credenciales.' -ForegroundColor Yellow
function ListPolicy([string]$prefix,[string]$path){
 try {
  if(!(Test-Path -LiteralPath $path)){Write-Host ('  '+$prefix+': sin directivas');return}
  $key=Get-Item -LiteralPath $path -ErrorAction Stop
  $vals=@($key.GetValueNames() | Where-Object {$_ -match '^\d+$'} | Sort-Object {[int]$_})
  if(!$vals.Count){Write-Host ('  '+$prefix+': sin reglas numeradas');return}
  Write-Host ('  '+$prefix+' ('+$vals.Count+' reglas):')
  foreach($n in $vals){
   $v=[string]$key.GetValue($n)
   if($v.Length -gt 240){$v=$v.Substring(0,240)}
   Write-Host ('    ['+$n+'] '+$v)
  }
 }catch{Write-Host ('  '+$prefix+': no se pudo leer: '+$_.Exception.Message) -ForegroundColor Yellow}
}
function BrowserPolicies([string]$scope,[string]$root){
 Write-Host ('')
 Write-Host ('--- '+$scope+' ---') -ForegroundColor Cyan
 ListPolicy 'Edge permite' ($root+'\Microsoft\Edge\URLAllowlist')
 ListPolicy 'Edge bloquea' ($root+'\Microsoft\Edge\URLBlocklist')
 # Google Chrome normalmente escribe debajo de Google\Chrome, no debajo de Microsoft.
 ListPolicy 'Chrome permite' ($root+'\Google\Chrome\URLAllowlist')
 ListPolicy 'Chrome bloquea' ($root+'\Google\Chrome\URLBlocklist')
}
BrowserPolicies 'Políticas para toda la PC (HKLM)' 'Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Policies'
BrowserPolicies 'Políticas de la sesión actual (HKCU)' 'Registry::HKEY_CURRENT_USER\SOFTWARE\Policies'
try{
 $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
 Write-Host ('SID de sesión inspeccionada: '+$sid)
}catch{}
# Para usuarios cargados y distintos del administrador, las reglas HKCU pueden ser diferentes.
try{
 foreach($hive in @(Get-ChildItem -LiteralPath 'Registry::HKEY_USERS' -ErrorAction Stop)){
  $sid=$hive.PSChildName
  if($sid -match '^S-1-5-21-[0-9-]+$'){
   $base=('Registry::HKEY_USERS\'+$sid+'\SOFTWARE\Policies')
   $exists=Test-Path -LiteralPath ($base+'\Microsoft\Edge\URLBlocklist')
   $exists=$exists -or (Test-Path -LiteralPath ($base+'\Microsoft\Edge\URLAllowlist'))
   $exists=$exists -or (Test-Path -LiteralPath ($base+'\Google\Chrome\URLBlocklist'))
   $exists=$exists -or (Test-Path -LiteralPath ($base+'\Google\Chrome\URLAllowlist'))
   if($exists){BrowserPolicies ('Políticas de otra sesión activa '+$sid) $base}
  }
 }
}catch{Write-Host 'No se pudieron enumerar las otras sesiones; probá el diagnóstico en la cuenta del alumno.' -ForegroundColor Yellow}
Write-Host ''
Write-Host '--- TAREAS QUE PUEDEN MODIFICAR LAS MISMAS REGLAS ---' -ForegroundColor Cyan
$names=@('Krueka-Conector-PC','Krueka-Conector-PC-Inicio','Krueka-PolicySync','KruekaAulaGuardian')
$tasks=@()
foreach($name in $names){
 try {
  $tsk=Get-ScheduledTask -TaskName $name -ErrorAction Stop
  $inf=Get-ScheduledTaskInfo -TaskName $name -ErrorAction Stop
  $tasks+=@{name=$name;state=[string]$tsk.State}
  Write-Host ('  '+$name+' | Estado: '+$tsk.State+' | Último código: '+$inf.LastTaskResult)
 }catch{Write-Host ('  '+$name+' | no encontrada')}
}
$old=@($tasks|Where-Object{$_.name -eq 'Krueka-Conector-PC' -and $_.state -ne 'Disabled'}).Count
$new=@($tasks|Where-Object{$_.name -eq 'Krueka-PolicySync' -and $_.state -ne 'Disabled'}).Count
if($old -and $new){
 Write-Host 'ALERTA: HAY DOS SINCRONIZADORES ACTIVOS. Ambos modifican las listas de Edge/Chrome y pueden sobrescribirse.' -ForegroundColor Red
 Write-Host 'No borres ninguno por tu cuenta: revisá las tareas y sus configuraciones con el administrador.' -ForegroundColor Yellow
}
Write-Host ''
Write-Host '--- NAVEGADORES EN EJECUCIÓN ---' -ForegroundColor Cyan
try{
 $procs=@(Get-Process -Name 'msedge','chrome','brave' -ErrorAction SilentlyContinue)
 if($procs.Count){$procs|Group-Object ProcessName|ForEach-Object{Write-Host ('  '+$_.Name+': '+$_.Count+' procesos')}}
 else{Write-Host '  No se encontró Edge, Chrome ni Brave en este momento.'}
}catch{}
Write-Host ''
Write-Host 'COMPROBACIÓN DECISIVA:' -ForegroundColor Green
Write-Host '  1. Desde la MISMA cuenta del alumno y el MISMO navegador bloqueado, escribí edge://policy (Edge) o chrome://policy (Chrome).'
Write-Host '  2. Pulsá Recargar directivas y buscá URLAllowlist y URLBlocklist.'
Write-Host '  3. Revisá Origen, Ámbito, Nivel y Estado, incluidos avisos de conflicto o error.'
Write-Host '  4. Enviá fotos de esos dos apartados SIN mostrar credenciales. 12/12 en Krueka NO verifica lo que aplica el navegador.'
