# Portable python build script

## Prerequisites
Install Microsoft .NET Framework 3.5 (to be able to install Microsoft Visuall C++ for Python)

## Run

To run this script, start Windows PowerShell with the "Run as Administrator" option. 
Only members of the Administrators group on the computer can change the execution policy.

This script will install a portable python distribution with nupic. The options are:
```
-cleanup: Clean the build dir and make sure python or VC++ for Python are installed from scratch.
-install_nupic: Install nupic (and nupic.bindings)
-nupic_unzip_path: Path to where to install nupic.
```

For example, to cleanup the build dir and install nupic in the directory Z:\tmp:
```
.\build_portable_python_with_nupic.ps1 -cleanup -install_nupic  -nupic_unzip_path "Z:\tmp"
```
