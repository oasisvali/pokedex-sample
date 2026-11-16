$runtimePath = Join-Path $PSScriptRoot '..\.tools\node'
if (Test-Path (Join-Path $runtimePath 'node.exe')) {
  $env:Path = "$runtimePath;$env:Path"
}
node --version
if ($LASTEXITCODE -ne 0) { throw 'Install Node 22.22.2 or newer before continuing.' }
