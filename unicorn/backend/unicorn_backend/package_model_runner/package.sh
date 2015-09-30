#!/usr/bin/env bash

BASE_DIR=/opt/numenta/products/numenta-apps
cd $BASE_DIR/unicorn/backend/unicorn_backend/

# cleanup
rm -rf build/ dist/ nupic/

# install nupic locally
pip install --target $BASE_DIR/unicorn/backend/unicorn_backend/nupic nupic

# package model runnner
python package_model_runner/freeze_model_runner.py

# cleanup
rm -rf nupic/

