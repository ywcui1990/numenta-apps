import cx_Freeze
import pyproj
import os
import htmengine

zipIncludes = []
includeFiles = [(pyproj.pyproj_datadir, os.path.join('pyproj', 'data')),
                ("/".join(htmengine.__file__.split("/")[:-1]) + 
                 '/algorithms/modelSelection/anomaly_params_random_encoder'
                 '/paramOrder.csv',
                 'htmengine/algorithms/modelSelection/anomaly_params_random_encoder/paramOrder.csv')]

executables = [cx_Freeze.Executable('model_runner.py', targetName = 'mr')]
freezer = cx_Freeze.Freezer(executables,
                            namespacePackages=['nupic', 'htmengine', 'prettytable'],
                            zipIncludes=zipIncludes,
                            includeFiles=includeFiles)

freezer.Freeze()
