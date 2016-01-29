## VM setup
Download VMware fusion 8
- Create a new VM
- Choose "Install OSX from the recovery partition"
- Install VM Ware Tools & restart.
- Get Xcode from the app store (you have to log in with your numenta icloud account to be able to use the app store) -- Wait for installation (it's pretty long). Open app and accept license terms.
- Get brew at brew.sh (install with `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`)
- Install cmake with `brew install cmake`. Check that it works: restart terminal and run `cmake`

### To create a backup of the VM
Source: http://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=2006202

> To back up the virtual machine (which includes the operating system, application files, settings, and user data), you need to make a copy of the folder in which the virtual machine is stored. Ensure that the virtual machine is not running or suspended while you are backing up the virtual machine.

To back up the virtual machine:
- Ensure your virtual machine is in a powered off state.
- Locate the virtual machine folder. For more information, see  Locating a hosted virtual machine's files (1003880)
- Right-click the virtual machine folder and click Copy.
- Navigate to the folder in which you want to store the backup, right-click anywhere within the folder, and click Paste.

To create a new VM the backup:
- Double click on the backup image.
- Select "I copied it"


## Building a portable python distribution with nupic and nupic.bindings

### Building automatically with the build script
* Follow instructions in the section `VM Setup`. You must have XCode and cmake installed.
* Run `build-python.sh`

### To check it worked
Say `PREFIX` is the install location of your python distribution. To check that nupic and nupic.bindings have been installed correctly, run:
```
DYLD_LIBRARY_PATH=$PREFIX/lib $PREFIX/bin/python -c "import nupic.algorithms.anomaly_likelihood"
DYLD_LIBRARY_PATH=$PREFIX/lib $PREFIX/bin/python -c "import nupic.bindings.math"
```
If you don't set `DYLD_LIBRARY_PATH` before calling python, it won't be able to find the nupic.core shared libraries. More on `DYLD_LIBRARY_PATH` here: https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man1/dyld.1.html



### Building manually a portable python distribution with nupic and nupic.bindings on OSX Yosemite 

#### env.sh
```
mkdir ~/portable_python
emacs ~/portable_python/env.sh
    PREFIX=~/portable_python/miniconda
    export PATH=${PREFIX}/bin:${PREFIX}/include:$PATH

source ~/portable_python/env.sh
```

#### miniconda
```
cd ~/portable_python
curl -O https://repo.continuum.io/miniconda/Miniconda-latest-MacOSX-x86_64.sh
bash Miniconda-latest-MacOSX-x86_64.sh
```
Follow script instructions:
- Accept license.
- Install to PREFIX dir (here `~/portable_python/miniconda`)
- Do not prepend install location to PYTHONPATH.

#### canp
```
cd ~/portable_python
curl -O https://capnproto.org/capnproto-c++-0.5.3.tar.gz
tar zxf capnproto-c++-0.5.3.tar.gz 
cd capnproto-c++-0.5.3 
./configure --disable-shared --prefix=$PREFIX
make -j6 check && make install
```

#### nupic.bindings
Optional: if pycapnp is commented out in nupic.core/bindings/py/requirements.txt, then you should `pip install pycapnp`. See troubleshooting section below if you have issues on OSX Yosemite.

WARNING: if you are installing pycapnpn on OSX Yosemite, you need to `export MACOSX_DEPLOYMENT_TARGET=10.10`, otherwise it will fail with `error: command 'gcc' failed with exit status 1`.

```
cd ~/portable_python
git clone https://github.com/numenta/nupic.bindings.git
export NUPIC_CORE=~/portable_python/nupic.core

cd $NUPIC_CORE
$PREFIX/bin/pip install -r bindings/py/requirements.txt 

mkdir -p $NUPIC_CORE/build/scripts
cd $NUPIC_CORE/build/scripts
cmake $NUPIC_CORE -DCMAKE_INCLUDE_PATH=${PREFIX}/include -DCMAKE_LIBRARY_PATH=${PREFIX}/lib -DCMAKE_PREFIX_PATH=${PREFIX} -DCMAKE_INSTALL_PREFIX=${PREFIX} -DPY_EXTENSIONS_DIR=${NUPIC_CORE}/bindings/py/nupic/bindings -DPYTHON_EXECUTABLE:FILEPATH=${PREFIX}/bin/python2.7 -DPYTHON_INCLUDE_DIR:PATH=${PREFIX}/include/2.7 -DPYTHON_LIBRARY:FILEPATH=${PREFIX}/lib/libpython2.7.dylib

cd $NUPIC_CORE
$PREFIX/bin/python setup.py install
```

#### nupic
NOTE: Before running `setup.py install` comment the line `nupic.bindings` in `nupic/external/common/requirements.txt` 

```
cd ~/portable_python
git clone https://github.com/numenta/nupic.git
cd nupic
$PREFIX/bin/pip install -r external/common/requirements.txt
$PREFIX/bin/python setup.py install
```


## Troubleshooting

### DYLIB_LIBRARY_PATH and OSX Yosemite
On OSX Yosemite, you may get an error related to `_sqlite3_intarray_bind` such as:
```
dyld: Symbol not found: _sqlite3_intarray_bind
  Referenced from: /System/Library/Frameworks/CoreData.framework/Versions/A/CoreData
  Expected in: /Users/marion/portable_python/miniconda/lib/libsqlite3.dylib
 in /System/Library/Frameworks/CoreData.framework/Versions/A/CoreData
Trace/BPT trap: 5
```

If this happends, then you should unset DYLIB_LIBRARY_PATH by running:
```
unset DYLIB_LIBRARY_PATH
```

It is usually not recommended to set DYLIB_LIBRARY_PATH on OSX Yosemite. See: https://trac.macports.org/ticket/46253

### MACOSX_DEPLOYMENT_TARGET and pycapnp on OSX Yosemite
On OSX Yosemite, you may get an error when installing `pycapnp`. This is documented here (https://github.com/numenta/nupic/issues/2061) as a _Yosemite gcc/clang -stdlib=c++ issue_.
Assuming you are running OSX 10.10, you can fix this by running:
```
export MACOSX_DEPLOYMENT_TARGET=10.10
```