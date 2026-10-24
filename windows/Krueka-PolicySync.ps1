# Krueka Aula - sincronizador de permisos web por equipo.
# Instalacion UNA vez por PC; cambios posteriores desde el panel del profesor.
# Ejecutar -Mode Install con PowerShell de ADMINISTRADOR. La tarea se ejecuta como SYSTEM.
# Solo gestiona URLAllowlist y URLBlocklist en Edge/Chrome; no toca Office, quiosco, cuentas o firewall.
[CmdletBinding()]
param([ValidateSet("Install","Once","Status")][string]$Mode="Status")
$ErrorActionPreference="Stop"
$root=Join-Path $env:ProgramData "Krueka\PolicySync"
$worker=Join-Path $root "Krueka-PolicySync.ps1"
$config=Join-Path $root "device.json"
$state=Join-Path $root "status.json"
$backup=Join-Path $root "Backups"
$task="Krueka-PolicySync"
$endpoint="https://janebfpnknapvntfqolf.supabase.co/functions/v1/aula-control"
$policies=@("HKLM:\SOFTWARE\Policies\Microsoft\Edge","HKLM:\SOFTWARE\Policies\Google\Chrome")
$essential=@("http://127.0.0.1:47821","https://www.google.com/recaptcha/")
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
function IsAdmin {
 $p=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
 return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function NeedAdmin {
 if(!(IsAdmin)){throw "Para instalar el sincronizador usá Ejecutar como administrador de Windows."}
}
function SecureFolder {
 # El secreto se cifra con DPAPI y los archivos se limitan a SYSTEM y Administradores.
 & icacls.exe "$root" /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
 if($LASTEXITCODE -ne 0){throw "No se pudieron proteger los permisos de la carpeta local."}
}
function ReadSecret {
 Add-Type -AssemblyName System.Security
 $cfg=Get-Content -LiteralPath $config -Raw -Encoding UTF8|ConvertFrom-Json
 if([string]$cfg.device_id -notmatch '^[0-9a-f-]{36}$' -or [string]$cfg.encrypted_token -notmatch '^[a-zA-Z0-9+/=]{32,}$'){
  throw "Configuración del dispositivo no válida."
 }
 $bytes=[Convert]::FromBase64String([string]$cfg.encrypted_token)
 $decoded=[Security.Cryptography.ProtectedData]::Unprotect($bytes,$null,[Security.Cryptography.DataProtectionScope]::LocalMachine)
 try{$token=[Text.Encoding]::UTF8.GetString($decoded)}
 finally{[array]::Clear($decoded,0,$decoded.Length)}
 if($token -notmatch '^[0-9a-f]{64}$'){throw "Credencial local corrupta. Revisar configuración."}
 return @{device_id=[string]$cfg.device_id;token=$token}
}
function Rpc($creds,$payload) {
 $headers=@{"x-device-id"=$creds.device_id;"Authorization"="Bearer "+$creds.token}
 $json=ConvertTo-Json -InputObject $payload -Depth 8 -Compress
 return Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($json)) -ContentType "application/json" -TimeoutSec 20 -ErrorAction Stop
}
function AsSafePolicy($data) {
 if($null -eq $data -or $null -eq $data.version){throw "El servidor no devolvió una política completa."}
 $version=[long]$data.version
 if($version -lt 1 -or $version -gt 9007199254740991){throw "Versión de política inválida."}
 if($data.enabled -isnot [bool]){throw "Estado de bloqueo inválido."}
 $list=@($data.allowlist)
 if($list.Count -lt 1 -or $list.Count -gt 90){throw "La lista excede el límite permitido."}
 $clean=New-Object 'System.Collections.Generic.List[string]'
 foreach($d in $list) {
  $host=([string]$d).ToLowerInvariant().Trim()
  if($host.Length -gt 253 -or $host -notmatch '^[a-z0-9]+([a-z0-9.-]*[a-z0-9])?$' -or
     !$host.Contains(".") -or $host.Contains("..") -or $host.StartsWith("-") -or $host.EndsWith("-")){
   throw "El servidor envió un nombre de dominio no admitido."
  }
  if(!$clean.Contains($host)){$clean.Add($host)}
 }
 if(!$clean.Contains("krueka.com") -or !$clean.Contains("janebfpnknapvntfqolf.supabase.co")){
  throw "Faltan dominios esenciales, se preserva la política anterior."
 }
 }
 return @{version=$version;enabled=[bool]$data.enabled;allow=@($clean)+$essential}
}
function GetPolicyValues([string]$keyName) {
 if(!(Test-Path -LiteralPath $keyName)){return @()}
 $key=Get-Item -LiteralPath $keyName
 return @($key.GetValueNames()|Where-Object{$_ -match '^\d+$'}|
  Sort-Object {[int]$_}|ForEach-Object{[string]$key.GetValue($_)})
}
function WritePolicyValues([string]$keyName,[string[]]$desired){
 $original=@(GetPolicyValues $keyName)
 if($original.Count -eq $desired.Count -and (@(Compare-Object -ReferenceObject $original -DifferenceObject $desired -SyncWindow 0).Count -eq 0)){
  return $false
 }
 if(!(Test-Path -LiteralPath $keyName)){New-Item -Path $keyName -Force | Out-Null}
 $key=Get-Item -LiteralPath $keyName
 $numeric=@($key.GetValueNames()|Where-Object{$_ -match '^\d+$'})
 foreach($name in $numeric){Remove-ItemProperty -LiteralPath $keyName -Name $name -ErrorAction Stop}
 for($i=0;$i -lt $desired.Count;$i++){
  New-ItemProperty -LiteralPath $keyName -Name ([string]($i+1)) -PropertyType String -Value $desired[$i] -Force | Out-Null
 }
 $result=@(GetPolicyValues $keyName)
 if($result.Count -ne $desired.Count -or
   (@(Compare-Object -ReferenceObject $result -DifferenceObject $desired -SyncWindow 0).Count -ne 0)){
  throw "Windows no confirmó las directivas del navegador."
 }
 return $true
}
function BackupPolicies([long]$version) {
 New-Item -ItemType Directory -Path $backup -Force|Out-Null
 foreach($browser in @("Edge","Chrome")){
  $name=if($browser -eq "Edge"){"Microsoft"}else{"Google"}
  $reg=if($browser -eq "Edge"){"HKLM\SOFTWARE\Policies\Microsoft\Edge"}else{"HKLM\SOFTWARE\Policies\Google\Chrome"}
  $file=Join-Path $backup ("$browser-"+$version+"-"+(Get-Date -Format "yyyyMMddHHmmss")+".reg")
  if(Test-Path -LiteralPath ($reg.Replace("HKLM\","HKLM:\"))){
   & reg.exe export "$reg" "$file" /y | Out-Null
   if($LASTEXITCODE -ne 0){throw "No se pudo respaldar la política de $browser."}
  }
 }
}
function SetPolicy($desired) {
 # Al comenzar el modo restringido se instala la lista permitida ANTES del bloqueo global.
 # Cuando se libera Internet se retira primero el bloqueo global.
 $allowed=@($desired.allow|Sort-Object -Unique)
 foreach($rootKey in $policies){
  $allowKey=Join-Path $rootKey "URLAllowlist"
  $blockKey=Join-Path $rootKey "URLBlocklist"
  if($desired.enabled){
   [void](WritePolicyValues $allowKey $allowed)
   [void](WritePolicyValues $blockKey @("*"))
  }else{
   [void](WritePolicyValues $blockKey @())
   [void](WritePolicyValues $allowKey $allowed)
  }
 }
}
function SaveStatus($result) {
 $json=ConvertTo-Json -InputObject $result -Depth 5
 [IO.File]::WriteAllText($state,$json,[Text.Encoding]::UTF8)
}
function RunOnce {
 if(!(Test-Path -LiteralPath $config)){throw "Primero instalá el sincronizador en esta PC."}
 $creds=ReadSecret
 $version=$null
 try{
  $remote=Rpc $creds @{action="policy_pull"}
  $desired=AsSafePolicy $remote
  $version=$desired.version
  $now=(Get-Date).ToUniversalTime().ToString("o")
  # La versión puede no cambiar aunque un alumno altere directivas. Siempre se verifica estado real.
  $currentOk=$true
  foreach($rootKey in $policies){
   $actual=@(GetPolicyValues (Join-Path $rootKey "URLAllowlist"))
   $want=@($desired.allow|Sort-Object -Unique)
   $block=@(GetPolicyValues (Join-Path $rootKey "URLBlocklist"))
   if($actual.Count -ne $want.Count -or
      @(Compare-Object $actual $want).Count -ne 0 -or
      ($desired.enabled -and ($block.Count -ne 1 -or $block[0] -ne "*")) -or
      (!$desired.enabled -and $block.Count -gt 0)){$currentOk=$false;break}
  }
  if(!$currentOk){
   BackupPolicies $version
   SetPolicy $desired
  }
  $reply=Rpc $creds @{action="policy_report";version=$version;error=""}
  if(!$reply.applied){throw "El servidor tiene otra versión de permisos; se actualizará en el próximo ciclo."}
  SaveStatus @{ok=$true;version=$version;enabled=$desired.enabled;at=$now;domains=$desired.allow.Count;error=""}
  Write-Host "Krueka: sincronizado (versión $version; bloqueo=$($desired.enabled))." -ForegroundColor Green
 }catch{
  $msg=([string]$_.Exception.Message)
  if($msg.Length -gt 240){$msg=$msg.Substring(0,240)}
  try{if($null -ne $version){[void](Rpc $creds @{action="policy_report";version=$version;error=$msg})}}catch{}
  SaveStatus @{ok=$false;version=$version;at=(Get-Date).ToUniversalTime().ToString("o");error=$msg}
  throw
 }
}
switch($Mode) {
 "Install" {
  NeedAdmin
  $id=Read-Host "Pegá el ID de esta PC (sin compartirlo con alumnos)"
  $id=([string]$id).Trim().ToLowerInvariant()
  if($id -notmatch '^[0-9a-f-]{36}$'){throw "ID de dispositivo no válido."}
  $secret=Read-Host "Pegá la credencial de Sincronización Web generada en Krueka" -AsSecureString
  $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try {$token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}
  finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
  if($token -notmatch '^[0-9a-f]{64}$'){throw "Credencial de sincronización no válida."}
  Add-Type -AssemblyName System.Security
  $encoded=[Text.Encoding]::UTF8.GetBytes($token)
  try {
   $protected=[Security.Cryptography.ProtectedData]::Protect($encoded,$null,[Security.Cryptography.DataProtectionScope]::LocalMachine)
  }finally{[array]::Clear($encoded,0,$encoded.Length)}
  if(!(Test-Path -LiteralPath $root)){New-Item -Path $root -ItemType Directory -Force|Out-Null}
  SecureFolder
  if($PSCommandPath -ne $worker){Copy-Item -LiteralPath $PSCommandPath -Destination $worker -Force}
  $configData=@{device_id=$id;encrypted_token=[Convert]::ToBase64String($protected)}
  [IO.File]::WriteAllText($config,(ConvertTo-Json $configData -Compress),[Text.Encoding]::UTF8)
  $taskCmd='powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+$worker+'" -Mode Once'
  & schtasks.exe /Create /F /SC MINUTE /MO 1 /TN "$task" /TR $taskCmd /RU SYSTEM /RL HIGHEST | Out-Null
  if($LASTEXITCODE -ne 0){throw "No se pudo registrar la tarea automática de Windows."}
  & schtasks.exe /Run /TN "$task" | Out-Null
  Write-Host "Sincronizador instalado UNA sola vez: Windows consultará el servidor cada minuto." -ForegroundColor Green
  Write-Host "No reemplaza ni reinicia el agente KruekaAula 0.5, Office ni el modo quiosco."
  Write-Host "La primera comprobación puede verse con -Mode Status en este mismo script."
 }
 "Once" {
  RunOnce
 }
 "Status" {
  if(Test-Path -LiteralPath $state){
   $s=Get-Content -LiteralPath $state -Raw -Encoding UTF8|ConvertFrom-Json
   Write-Host ("Última verificación: "+$s.at)
   Write-Host ("Versión: "+$s.version+" | Correcto: "+$s.ok)
   if($s.error){Write-Warning $s.error}
  }else{Write-Warning "Todavía no hay una sincronización local registrada."}
  & schtasks.exe /Query /TN "$task" /FO LIST 2>$null
  if($LASTEXITCODE -ne 0){Write-Warning "La tarea Krueka-PolicySync aún no está registrada."}
 }
}
