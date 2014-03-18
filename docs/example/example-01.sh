#!/bin/bash
#------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#------------------------------------------------------------------------------

OPTIND=1

AWS_REGION=""
GROK_SERVER=""
INSTANCES_TO_MONITOR=""

show_credential_usage() {
  echo "You must set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
  echo " before running this example."
  echo
  echo "ex: AWS_SECRET_ACCESS_KEY='foo' AWS_ACCESS_KEY_ID='bar' ./$0"
  echo
  echo "or"
  echo
  echo "export AWS_ACCESS_KEY_ID=YOURACCESSKEY"
  echo "export AWS_SECRET_ACCESS_KEY=YOURSECRETKEY"
  echo "./$0"
  echo
}

show_help() {
  show_credential_usage
  echo "$0 -s https://your.grok.server -r AWS_REGION -i instance-id -i instance-id"
  echo
  echo "If you are working with a running server, add -a API_KEY"
  echo
}

parse_cli(){
  while getopts "ha:i:r:s:" opt; do
    case "$opt" in
      h) show_help
         exit 0
         ;;
      a) GROK_API_KEY="$OPTARG"
         ;;
      i) INSTANCES_TO_MONITOR="$INSTANCES_TO_MONITOR $OPTARG"
         ;;
      r) AWS_REGION="$OPTARG"
         ;;
      s) GROK_SERVER="$OPTARG"
         ;;
    esac
  done
}

sanity_check_configuration() {
  if [ -z $AWS_ACCESS_KEY_ID ]; then
    show_credential_usage
    exit 1
  fi
  if [ -z $AWS_SECRET_ACCESS_KEY ]; then
    show_credential_usage
    exit 1
  fi
  if [ "$INSTANCES_TO_MONITOR" == "" ]; then
    echo "You must specify at least one instance id with -i"
    show_help
    exit 1
  fi
  if [ "$AWS_REGION" == "" ]; then
    echo "You must specify the AWS region with -r"
    show_help
    exit 1
  fi
  if [ "$GROK_SERVER" == "" ]; then
    echo "You must specify the Grok server to configure with -s"
    show_help
    exit 1
  fi
  which grok &> /dev/null
  if [ $? != 0 ]; then
    echo 'grok needs to be installed and in your $PATH'
    echo
    echo "Have you run python setup.py install or pip install grokcli yet?"
    exit 1
  fi
}

set_server_credentials() {
  grok credentials ${GROK_SERVER} \
    --AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
    --AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
}

monitor_instances() {
  for instance in ${INSTANCES_TO_MONITOR}
  do
    echo "Monitoring ${instance} in ${AWS_REGION}"
    grok cloudwatch instances monitor ${GROK_SERVER} ${GROK_API_KEY} \
      --namespace='AWS/EC2' \
      --region=${AWS_REGION} \
      --instance=${instance}
  done
}

configure_grok_server() {
  if [ -z ${GROK_API_KEY} ]; then
    echo "Setting server credentials"
    GROK_API_KEY=$(set_server_credentials)
    echo "Generated GROK_API_KEY, ${GROK_API_KEY}"
  else
    echo "Using preset GROK_API_KEY: ${GROK_API_KEY}"
  fi
  monitor_instances
}

parse_cli $*
sanity_check_configuration
echo "Configuring ${GROK_SERVER}..."
configure_grok_server
echo "GROK_API_KEY: ${GROK_API_KEY}"
