# Krueka - excepciones educativas para todo el equipo (Edge y Chrome).
# Comprobar: solo lectura. Aplicar: como administrador de Windows, sin retirar restricciones existentes.
[CmdletBinding()]
param([ValidateSet("Comprobar","Aplicar")][string]$Modo="Comprobar")
$ErrorActionPreference="Stop"
$patterns=@(
 "https://betesda-educacion.edclub.com",
 "https://edclub.com", "https://edclub.dev", "https://edclub.app",
 "https://typingclub.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com",
 "https://code.org", "https://codeaiprojects.org", "https://codeprojects.org",
 "https://downloads.computinginthecore.org", "https://api.pusherapp.com",
 "https://www.google.com/recaptcha/"
)
# Las entradas generales https://edclub.com y https://code.org abarcan sus subdominios
# y todas sus rutas (URLAllowlist de Chromium, formato [scheme://][.]host[/path]).
$roots=@("HKLM:\SOFTWARE\Policies\Microsoft\Edge","HKLM:\SOFTWARE\Policies\Google\Chrome")
$backup=Join-Path $env:ProgramData "Krueka\Respaldo-Politicas"
function IsAdmin(){
 $principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
 return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function Existing($keyPath){
 if(!(Test-Path -LiteralPath $keyPath)){return @()}
 $key=Get-Item -LiteralPath $keyPath
 return @($key.GetValueNames()|ForEach-Object {[string]$key.GetValue($_)})
}
if($Modo -eq "Aplicar"){
 if(!(IsAdmin)){throw "Ejecutar como administrador. No se hicieron cambios."}
 New-Item -Path $backup -ItemType Directory -Force|Out-Null
 foreach($root in $roots){
  $registry=$root.Replace("HKLM:\","HKLM\")
  if(Test-Path -LiteralPath $root){
   $destination=Join-Path $backup ("Educativas-"+($root.Split("\")[-1])+"-"+(Get-Date -Format "yyyyMMdd-HHmmss")+".reg")
   & reg.exe export "$registry" "$destination" /y|Out-Null
   if($LASTEXITCODE -ne 0){throw "No se pudo respaldar $registry. Operacion interrumpida."}
   Write-Host "Respaldo: $destination"
  }
  $path=Join-Path $root "URLAllowlist"
  if(!(Test-Path -LiteralPath $path)){New-Item -Path $path -Force|Out-Null}
  $key=Get-Item -LiteralPath $path
  $names=@($key.GetValueNames())
  $already=@($names|ForEach-Object {[string]$key.GetValue($_)})
  $numbers=@($names|Where-Object {$_ -match '^\d+$'}|ForEach-Object {[int]$_})
  $next=1
  if($numbers.Count){$next=([int](($numbers|Measure-Object -Maximum).Maximum))+1}
  foreach($pattern in $patterns){
   if($already -notcontains $pattern){
    New-ItemProperty -LiteralPath $path -Name ([string]$next) -Value $pattern -PropertyType String -Force|Out-Null
    $next++
    Write-Host "Autorizado en $root : $pattern"
   }
  }
 }
}
Write-Host ""
Write-Host "KRUEKA - EXCEPCIONES EDUCATIVAS (EDCLUB + CODE.ORG)" -ForegroundColor Cyan
Write-Host ("Equipo: "+$env:COMPUTERNAME+"; modo: "+$Modo)
foreach($root in $roots){
 $present=Existing (Join-Path $root "URLAllowlist")
 $missing=@($patterns|Where-Object {$present -notcontains $_})
 Write-Host (($root.Split("\")[-1])+": "+($patterns.Count-$missing.Count)+"/"+$patterns.Count+" permisos encontrados.")
 foreach($p in $missing){Write-Warning ("No disponible en "+$root+": "+$p)}
}
Write-Host "Se conserva el bloqueo general. No se altera Office, quiosco, cuentas ni tokens."
Write-Host "Para probar: reinicia Edge y Chrome, entra a edge://policy y chrome://policy, y abre lecciones de ambos sitios."
Write-Host "Si el agente o dominio corporativo administra el navegador, puede sobrescribir estas directivas."
