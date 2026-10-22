# KRUEKA - recuperar instalador Brave v0.5 interrumpido por respaldo anterior.
# NO deshabilita quiosco ni Internet, no modifica tokens, identidades o cuentas.
# Comprobar: lectura. PrepararReintento: archivo de respaldo archivado de forma segura.
[CmdletBinding()]
param(
 [ValidateSet("Comprobar","PrepararReintento")]
 [string]$Modo="Comprobar"
)
$ErrorActionPreference="Stop"
$stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$folder="KruekaAula"
$programPaths=@(
 [Environment]::GetEnvironmentVariable("ProgramFiles(x86)"),
 $env:ProgramFiles,
 $env:ProgramW6432
) | Where-Object { $_ } | Select-Object -Unique
$candidates=@($programPaths|ForEach-Object{Join-Path $_ $folder})
$backups=@($candidates|Where-Object{Test-Path -LiteralPath (Join-Path $_ "KruekaAula.exe.pre-brave-05.bak") -PathType Leaf})
Write-Host ""
Write-Host "KRUEKA - RECUPERACION DEL ACTUALIZADOR V0.5" -ForegroundColor Cyan
Write-Host ("Equipo: "+$env:COMPUTERNAME)
Write-Host ("Modo: "+$Modo)
if(!$backups.Count){
 Write-Warning "No se encontro KruekaAula.exe.pre-brave-05.bak en Program Files/Program Files (x86)."
 Write-Host "Este equipo no muestra el bloqueo exacto fotografiado, o fue resuelto."
 exit 0
}
if($backups.Count -gt 1){
 throw "Hay varios respaldos en carpetas de instalacion diferentes. No se modifico nada. Requiere identificar el agente instalado."
}
$install=$backups[0]
$exe=Join-Path $install "KruekaAula.exe"
$bak=Join-Path $install "KruekaAula.exe.pre-brave-05.bak"
$archiveDir=Join-Path $env:ProgramData "Krueka\Respaldo-Actualizadores"
function BinarioValido([string]$p){
 if(!(Test-Path -LiteralPath $p -PathType Leaf)){return $false}
 $f=Get-Item -LiteralPath $p -ErrorAction Stop
 if($f.Length -lt 4096){return $false}
 $handle=[IO.File]::OpenRead($p)
 try{
  $one=$handle.ReadByte();$two=$handle.ReadByte()
  return ($one -eq 77 -and $two -eq 90)
 }finally{$handle.Dispose()}
}
function HashFile([string]$p){return (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash}
function Admin(){
 $me=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
 return $me.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
Write-Host ("Instalacion: "+$install)
Write-Host ("Respaldo anterior: "+$bak)
$validBackup=BinarioValido $bak
$validExe=BinarioValido $exe
Write-Host ("Respaldo ejecutable aparentemente valido: "+$(if($validBackup){"SI"}else{"NO"}))
Write-Host ("Agente principal instalado: "+$(if($validExe){"SI"}else{"NO"}))
if(Test-Path -LiteralPath $exe -PathType Leaf){
 Write-Host ("Agente actual SHA256: "+(HashFile $exe))
}
if($validBackup){Write-Host ("Respaldo SHA256: "+(HashFile $bak))}
if(!$validBackup){
 throw "El respaldo es incompleto o no tiene firma basica de ejecutable. No se va a tocar."
}
if((Test-Path -LiteralPath $exe -PathType Leaf) -and !$validExe){
 throw "Existe KruekaAula.exe, pero esta incompleto o danado. Se necesita revisar manualmente. No se reemplazo."
}
if($Modo -eq "Comprobar"){
 Write-Host ""
 Write-Host "Diagnostico terminado, SIN CAMBIOS." -ForegroundColor Green
 if($validExe){
  Write-Host "El ejecutable actual existe. Un administrador puede archivar el viejo .bak y repetir la actualizacion original."
 }else{
  Write-Warning "Falta el agente principal. PrepararReintento restaurara una copia del respaldo ANTES de archivar el antiguo."
 }
 exit 0
}
if(!(Admin)){throw "PrepararReintento requiere abrir la consola como administrador de Windows."}
New-Item -ItemType Directory -Path $archiveDir -Force|Out-Null
$archived=Join-Path $archiveDir ("KruekaAula.exe.pre-brave-05."+ $stamp +".bak")
if(Test-Path -LiteralPath $archived){throw "Ya existe archivo de respaldo con ese nombre. No se modifico nada."}
$backupHash=HashFile $bak
# Recuperar el agente solamente cuando falta el ejecutable; preservar el backup hasta verificar.
if(!$validExe){
 $temp=Join-Path $install ("KruekaAula.exe.recuperacion-"+$stamp+".tmp")
 if(Test-Path -LiteralPath $temp){throw "Archivo temporal de recuperacion existente. No se modifico nada."}
 try{
  Copy-Item -LiteralPath $bak -Destination $temp -ErrorAction Stop
  if((HashFile $temp) -ne $backupHash){throw "Error al copiar respaldo (hash diferente)."}
  if(Test-Path -LiteralPath $exe){throw "Aparecio KruekaAula.exe durante la recuperacion; no se reemplaza."}
  Move-Item -LiteralPath $temp -Destination $exe -ErrorAction Stop
  if(!(BinarioValido $exe) -or (HashFile $exe) -ne $backupHash){
   throw "La copia restaurada no coincide con el respaldo. Requiere inspeccion manual."
  }
  Write-Host "Se recupero KruekaAula.exe copiando el respaldo original." -ForegroundColor Green
 }finally{
  if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue}
 }
}
# Archivar en carpeta separada: la actualizacion podra crear un NUEVO .bak.
Move-Item -LiteralPath $bak -Destination $archived -ErrorAction Stop
if(!(Test-Path -LiteralPath $archived) -or (HashFile $archived) -ne $backupHash){
 throw "No se pudo verificar el archivado. No se debe ejecutar el actualizador."
}
if(Test-Path -LiteralPath $bak){
 throw "El nombre original .bak aun existe. No se debe ejecutar el actualizador."
}
Write-Host ""
Write-Host "PREPARACION COMPLETADA: respaldo conservado de forma segura." -ForegroundColor Green
Write-Host ("Archivo conservado: "+$archived)
Write-Host "Ahora ejecuta manualmente el actualizador ORIGINAL como administrador:"
Write-Host "Krueka-Aula-Control-Actualizador-Brave-v05.exe"
Write-Host "Si vuelve a fallar, NO borres ni renombres otros archivos; comparte el error."
Write-Host "Despues comprueba que la PC vuelva a Conectada y PC: Ofimatica en Krueka."
