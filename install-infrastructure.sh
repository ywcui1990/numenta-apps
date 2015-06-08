#!/bin/bash

set -o errexit

function install {
  pushd $1
  python setup.py develop --install-dir=$2 --script-dir=$3
  popd
}

install infrastructure $1 $2
