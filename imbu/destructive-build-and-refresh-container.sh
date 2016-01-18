#!/bin/bash

rm -rf `pwd`/cache/*
docker kill imbu
docker rm imbu
docker build --no-cache -t imbu:latest .
docker run \
  --name imbu \
  -d \
  -p 8080:80 \
  -e IMBU_LOAD_PATH_PREFIX=${IMBU_LOAD_PATH_PREFIX} \
  -e IMBU_SAVE_PATH_PREFIX=${IMBU_SAVE_PATH_PREFIX} \
  -e CORTICAL_API_KEY=${CORTICAL_API_KEY} \
  -e IMBU_RETINA_ID=${IMBU_RETINA_ID} \
  ${IMBU_DOCKER_EXTRAS} \
  imbu:latest
