# Krueka - PC de aula: diagnostico de Office y conexion del agente.
# Comprobar no cambia nada. ReiniciarAgente requiere Windows administrador.
# No borra cuentas, tokens, politicas, bloqueos de Internet o configuracion del quiosco.
[CmdletBinding()]
param([ValidateSet("Comprobar","ReiniciarAgente")][string]$Modo="Comprobar")
$ErrorActionPreference="Stop"
$endpoint="janebfpnknapvntfqolf.supabase.co"
function EsAdmin {
 $p=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
 return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function Agentes {
 $found=New-Object System.Collections.Generic.List[object]
 try {
  foreach($svc in @(Get-CimInstance Win32_Service -ErrorAction Stop |
    Where-Object { $_.Name -match '(?i)krueka' -or $_.DisplayName -match '(?i)krueka' -or $_.PathName -match '(?i)krueka' })) {
   $found.Add([pscustomobject]@{Tipo="Servicio";Nombre=$svc.Name;Estado=$svc.State;Inicio=$svc.StartMode})
  }
 }catch {Write-Warning "No se pudo consultar los servicios. Ejecuta con permisos de administrador."}
 try {
  foreach($task in @(Get-ScheduledTask -ErrorAction Stop |
    Where-Object { $_.TaskName -match '(?i)krueka' -or $_.TaskPath -match '(?i)krueka' })) {
   $found.Add([pscustomobject]@{Tipo="Tarea";Nombre=$task.TaskPath+$task.TaskName;Estado=[string]$task.State;Inicio="Programada"})
  }
 }catch {Write-Warning "No se pudieron leer las tareas programadas."}
 return $found
}
function OfficeDetectado {
 $roots=@($env:ProgramFiles,$env:ProgramW6432,[Environment]::GetEnvironmentVariable("ProgramFiles(x86)")) |
  Where-Object {$_}|Select-Object -Unique
 foreach($app in @("WINWORD.EXE","EXCEL.EXE","POWERPNT.EXE")){
  $pathFound=$null
  foreach($root in $roots) {
   foreach($rel in @("Microsoft Office\root\Office16","Microsoft Office\Office16","Microsoft Office\Office15")) {
    $p=Join-Path (Join-Path $root $rel) $app
    if(Test-Path -LiteralPath $p -PathType Leaf) {$pathFound=$p;break}
   }
   if($pathFound){break}
  }
  if($pathFound){Write-Host ("  "+$app+": instalado ("+$pathFound+")") -ForegroundColor Green}
  else{Write-Warning ($app+": no encontrado en las rutas habituales. Puede ser instalacion personalizada.")}
 }
}
function Diagnostico {
 Write-Host ""
 Write-Host "KRUEKA - COMPROBACION LOCAL DE OFFICE" -ForegroundColor Cyan
 Write-Host ("Equipo Windows: "+$env:COMPUTERNAME)
 $os=Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
 if($os){Write-Host ("Sistema: "+$os.Caption+" ("+$os.Version+")")}
 Write-Host ("Administrador actual: "+$(if(EsAdmin){"SI"}else{"NO"}))
 Write-Host ""
 Write-Host "Agente de Krueka:" -ForegroundColor Cyan
 $agents=@(Agentes)
 if(!$agents.Count){Write-Warning "No se localizo un servicio o tarea programada llamado Krueka. Puede estar instalado con otro nombre o no estar iniciando."}
 else{$agents|Format-Table Tipo,Nombre,Estado,Inicio -AutoSize}
 Write-Host ""
 Write-Host "Microsoft Office:" -ForegroundColor Cyan
 OfficeDetectado
 Write-Host ""
 Write-Host "Conectividad al servidor Krueka:" -ForegroundColor Cyan
 try{
  $tcp=Test-NetConnection -ComputerName $endpoint -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
  Write-Host ("  Supabase (HTTPS 443): "+$(if($tcp){"CONECTA"}else{"NO CONECTA"}))
 }catch{Write-Warning ("Fallo al comprobar HTTPS: "+$_.Exception.Message)}
 Write-Host ""
 Write-Host "Modo quiosco Windows:" -ForegroundColor Cyan
 try{
  $cmd=Get-Command Get-AssignedAccess -ErrorAction SilentlyContinue
  if($cmd){
   $conf=Get-AssignedAccess -ErrorAction Stop
   if($conf){Write-Host ("  Assigned Access de aplicacion unica: "+($conf|Out-String).Trim())}
   else{Write-Host "  Sin configuracion de aplicacion unica consultable con Get-AssignedAccess."}
  }else{Write-Host "  Windows no ofrece el comando Get-AssignedAccess en esta edicion."}
 }catch{Write-Warning "No se pudo leer Assigned Access. Usa la cuenta administradora."}
 foreach($log in @("Microsoft-Windows-AssignedAccess/Admin","Microsoft-Windows-AssignedAccess/Operational")){
  try{
   if(Get-WinEvent -ListLog $log -ErrorAction SilentlyContinue) {
    $recent=@(Get-WinEvent -FilterHashtable @{LogName=$log;StartTime=(Get-Date).AddDays(-2)} -MaxEvents 12 -ErrorAction SilentlyContinue |
      Where-Object{$_.LevelDisplayName -in @("Error","Warning")} | Select-Object -First 4)
    foreach($e in $recent){
     $safe=([string]$e.Message -replace '[\r\n]+',' ')
     if($safe.Length -gt 250){$safe=$safe.Substring(0,250)}
     Write-Host ("  "+$e.TimeCreated.ToString("dd/MM HH:mm")+" ["+$e.LevelDisplayName+"] "+$safe)
    }
   }
  }catch{Write-Warning "No se pudieron leer eventos del quiosco: $log"}
 }
 Write-Host ""
 Write-Host "ATENCION: No ejecutes Eliminar quiosco ni cambies el token de Krueka." -ForegroundColor Yellow
 Write-Host "Si Office esta instalado, pero la PC continua sin sincronizar, reparar el agente primero."
 Write-Host "Si la PC sincroniza y Office sigue bloqueado, revisar si esta en quiosco de solo Edge."
}
if($Modo -eq "ReiniciarAgente"){
 if(!(EsAdmin)){throw "Se necesita una cuenta administradora de Windows."}
 $found=@(Agentes)
 if(!$found.Count){throw "No se encontro un servicio/tarea Krueka. Se necesita revisar o reinstalar el agente ORIGINAL, sin generar token nuevo."}
 Write-Host "Se intentara iniciar/reiniciar solamente los servicios y tareas identificados por nombre Krueka."
 foreach($agent in $found){
  try {
   if($agent.Tipo -eq "Servicio") {
    $service=Get-Service -Name $agent.Nombre -ErrorAction Stop
    if($service.Status -eq "Running"){Restart-Service -Name $agent.Nombre -ErrorAction Stop}
    else {Start-Service -Name $agent.Nombre -ErrorAction Stop}
    Write-Host ("Servicio actualizado: "+$agent.Nombre) -ForegroundColor Green
   }else{
    # La tarea es encontrada por la ruta y nombre exactos; no se ejecutan otros comandos.
    $full=[string]$agent.Nombre
    $ix=$full.LastIndexOf("\")
    $path=$full.Substring(0,$ix+1)
    $name=$full.Substring($ix+1)
    Start-ScheduledTask -TaskName $name -TaskPath $path -ErrorAction Stop
    Write-Host ("Tarea iniciada: "+$full) -ForegroundColor Green
   }
  }catch {Write-Warning ("No se pudo iniciar "+$agent.Nombre+": "+$_.Exception.Message)}
 }
 Write-Host "Volve a comprobar el estado de Office y conexion desde el panel docente de Krueka."
}
Diagnostico
