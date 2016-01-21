# Prerequisite: Install Microsoft .NET Framework 3.5 (to be able to install 
# Microsoft Visuall C++ for Python)
# 
# To run this script:
# 1. Start Windows PowerShell with the "Run as Administrator" option.
#    Only members of the Administrators group on the computer can change 
#    the execution policy.
# 2. Enable running unsigned scripts: Set-ExecutionPolicy RemoteSigned
#    This will allow running unsigned scripts that you write on your local
#   computer and signed scripts from Internet.

$script_path = split-path -parent $MyInvocation.MyCommand.Definition

# Python 
$python_version = "2.7.11"
$portable_python_path = "$script_path\portable_python"
$python_msi_url = "https://www.python.org/ftp/python/$python_version/python-$python_version.amd64.msi"
$python_msi_path = "$script_path\python-$python_version.amd64.msi"

# Pip
$get_pip_url = "https://bootstrap.pypa.io/get-pip.py"
$get_pip_path = "$script_path\get-pip.py"

# Microsoft .NET
$msft_net_exe_url = "https://download.microsoft.com/download/7/0/3/703455ee-a747-4cc8-bd3e-98a615c3aedb/dotNetFx35setup.exe"
$msft_net_exe_path = "$script_path\dotNetFx35setup.exe"

# Microsoft Visual C++ for Python
$msft_vc_msi_url = "https://download.microsoft.com/download/7/9/6/796EF2E4-801B-4FC4-AB28-B59FBF6D907B/VCForPython27.msi"
$msft_vc_msi_path = "$script_path\VCForPython.msi"

# nupic.bindings
$wheelhouse_path = "$script_path\wheelhouse"
$nupic_bindings_version = "0.2.8.dev0"
$nupic_bindings_whl_url = "http://s3-us-west-2.amazonaws.com/artifacts.numenta.org/numenta/nupic.core/releases/nupic.bindings/nupic.bindings-$nupic_bindings_version-cp27-none-win_amd64.whl"
$nupic_bindings_whl_path = "$wheelhouse_path\nupic.bindings-$nupic_bindings_version-cp27-none-win_amd64.whl"

# nupic
$nupic_version = "0.3.6"
$nupic_zip_url = "https://github.com/numenta/nupic/archive/$nupic_version.zip"
$nupic_zip_path = "$script_path\nupic-$nupic_version.zip"
$nupic_path = "$script_path\nupic-$nupic_version"

# Utility function to unzip files
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Unzip
{
    param([string]$zipfile, [string]$outpath)

    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipfile, $outpath)
}

Write-Host "==> Cleaning up files and directories ..."
Remove-Item -Force -ErrorAction Ignore $python_msi_path
Remove-Item -Force -ErrorAction Ignore $get_pip_path
Remove-Item -Force -ErrorAction Ignore $msft_vc_msi_path
Remove-Item -Force -ErrorAction Ignore $nupic_zip_path
Remove-Item -Force -ErrorAction Ignore $portable_python_path -Recurse
Remove-Item -Force -ErrorAction Ignore $wheelhouse_path -Recurse
Remove-Item -Force -ErrorAction Ignore $nupic_path -Recurse
New-Item $portable_python_path -type Directory | Out-Null
New-Item $wheelhouse_path -type Directory | Out-Null

Write-Host "==> Downloading Python ..."
Invoke-WebRequest -Uri $python_msi_url -OutFile $python_msi_path

Write-Host "==> Installing Python ..."
Start-Process  -Wait -FilePath msiexec -ArgumentList /a, $python_msi_path, ALLUSERS=0, TARGETDIR=$portable_python_path, /qn

Write-Host "==> Downloading get-pip.py ..."
Invoke-WebRequest -Uri $get_pip_url -OutFile $get_pip_path 

Write-Host "==> Installing pip ..."
Invoke-Expression "$portable_python_path\python.exe $get_pip_path"

Write-Host "==> Downloadlsing Microsoft Visual C++ Compiler for Python ..."
Invoke-WebRequest -Uri $msft_vc_msi_url -OutFile $msft_vc_msi_path

Write-Host "==> Installing Microsoft Visual C++ Compiler for Python ..."
Start-Process -Wait -FilePath msiexec -ArgumentList /q, /a, VCForPython.msi, ALLUSERS=1

Write-Host "==> Downloading nupic.bindings wheel ..."
Invoke-WebRequest -Uri $nupic_bindings_whl_url -OutFile $nupic_bindings_whl_path

Write-Host "==> Installing nupic.bindings wheel ..."
Invoke-Expression "$portable_python_path\Scripts\pip.exe install $nupic_bindings_whl_path"

Write-Host "==> Downloading nupic source ..."
Invoke-WebRequest -Uri $nupic_zip_url -OutFile $nupic_zip_path

Write-Host "==> Unzip nupic source"
Unzip $nupic_zip_path $nupic_path

Write-Host "==> Building nupic wheel ..."
Invoke-Expression "$portable_python_path\Scripts\pip.exe install wheel"
Invoke-Expression "$portable_python_path\python.exe $nupic_path\$nupic_path\setup.py bdist_wheel -d $wheelhouse_path"

Write-Host "==> Installing nupic wheel ..."
Invoke-Expression "$portable_python_path\Scripts\pip.exe install $wheelhouse_path\nupic-$nupic_version.dev0-py2-none-any.whl"
