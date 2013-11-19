#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
import sys
from optparse import OptionParser

import commands



availableCommands = __import__("grokcli.commands", globals(), locals(), ['*'])

commands = dict([
    (cmd, getattr(availableCommands, cmd))
    for cmd in availableCommands.__all__
  ])

usage = "%prog [command] [options]\n\n" \
        "Available commands:\n"

for command in commands:
  usage += "\n    " + command

parser = OptionParser(usage=usage)


def handle(options, args):
  parser.print_help()


def main():
  try:
    subcommand = sys.argv.pop(1)
  except IndexError:
    parser.print_help()
    sys.exit()

  submodule = commands.get(subcommand, sys.modules[__name__])

  (options, args) = submodule.parser.parse_args(sys.argv[1:])

  submodule.handle(options, args)
