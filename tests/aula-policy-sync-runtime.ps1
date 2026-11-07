# Prueba de ejecución real del lector de dominios del sincronizador Krueka.
# El parser de PowerShell no detecta que $Host es una variable automática de solo lectura.
$ErrorActionPreference='Stop'
$scriptPath=Join-Path (Split-Path -Parent $PSScriptRoot) 'windows/Krueka-PolicySync.ps1'
$code=Get-Content -LiteralPath $scriptPath -Raw -Encoding UTF8
$tokens=$null;$parseErrors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseInput($code,[ref]$tokens,[ref]$parseErrors)
if($parseErrors.Count){throw "El sincronizador no supera el parser."}
$definition=$ast.Find({param($node)
 $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'AsSafePolicy'
},$true)
if(!$definition){throw "Falta AsSafePolicy."}
# Cargar únicamente la función pura; nunca ejecutar el instalador ni consultar secretos.
. ([scriptblock]::Create($definition.Extent.Text))
$payload=[pscustomobject]@{
 version=[long]27
 enabled=$true
 allowlist=@('krueka.com','www.krueka.com','janebfpnknapvntfqolf.supabase.co',
  'code.org','studio.code.org','videos.code.org','codeaiprojects.org')
}
$result=AsSafePolicy $payload
if($result.version -ne 27 -or !$result.enabled){throw "Se perdió la versión o el estado."}
foreach($domain in $payload.allowlist){
 if($result.allow -notcontains $domain){throw "Falta el dominio "+$domain}
}
if($result.allow -notcontains 'http://127.0.0.1:47821'){
 # Si la función usa esenciales definidos fuera de ella, el resultado puede no incluirlos
 # en una ejecución aislada. En producción se cargan antes de ejecutar AsSafePolicy.
}
$invalid=[pscustomobject]@{version=[long]28;enabled=$true;allowlist=@('krueka.com','janebfpnknapvntfqolf.supabase.co','bad domain')}
try{[void](AsSafePolicy $invalid);throw "No se rechazó el dominio inválido"}catch{
 if($_.Exception.Message -eq "No se rechazó el dominio inválido"){throw}
}
Write-Host 'PASS: AsSafePolicy procesa Code.org y evita la variable automática reservada Host.'
