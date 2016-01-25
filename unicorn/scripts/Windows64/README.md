# Portable python build script

## Prerequisites
* Install [Microsoft .NET Framework 3.5](https://www.microsoft.com/en-us/download/details.aspx?id=21) to be able to install Microsoft 
Visual C++ for Python.
* Install [Visual C++ for Python](http://aka.ms/vcpython27).

## Run

To run this script, start Windows PowerShell with the "Run as Administrator" option. 
Only members of the Administrators group on the computer can change the execution policy.

This script will install a portable python distribution with nupic. The options are:
```
-cleanup: (default: False) Clean the build dir and make sure python or VC++ for Python are installed from scratch.
-install_nupic: (default: False) Install nupic (and nupic.bindings)
-nupic_unzip_path: (default: <build_script_dir>) Path where to install nupic.
```

For example, to cleanup the build dir and install nupic in the directory Z:\tmp:
```
.\build_portable_python_with_nupic.ps1 -cleanup -install_nupic  -nupic_unzip_path "Z:\tmp"
```
