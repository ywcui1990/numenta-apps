#!/usr/bin/env bash

# Temporary. NUMENTA_APPS_DIR can be an env variable.
NUMENTA_APPS_DIR=~/_git/numenta-apps

# cleanup
rm -rf build/ dist/ local_nupic/

# install nta.utils
cd $NUMENTA_APPS_DIR/nta.utils
python setup.py install --user

# install htmengine
cd $NUMENTA_APPS_DIR/htmengine
python setup.py install --user

# install nupic locally
cd $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/
pip install --target local_nupic nupic

# WARNING: temporary. Here until model_runner is fixed. See ENG-73.
cd $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/
rm -rf htmengine/
cp -r $NUMENTA_APPS_DIR/htmengine/htmengine $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/htmengine
cp  $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/package_model_runner/new_init.py  $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/htmengine/__init__.py
cp $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/package_model_runner/new_clusterParams.py  $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/htmengine/algorithms/modelSelection/clusterParams.py

# package model runnner
cd $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/
python package_model_runner/freeze_model_runner.py build

# add missing dependencies in library.zip for nupic
cd $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/local_nupic
zip $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/dist/library.zip -r -u nupic/*

# add missing dependencies in library.zip for htmengine
cd $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/
zip $NUMENTA_APPS_DIR/unicorn/backend/unicorn_backend/dist/library.zip -r  -u htmengine/*