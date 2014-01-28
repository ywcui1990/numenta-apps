Grok Command Line Interface
===========================

Command line interface (CLI) tools for interacting with a Grok server.

Requires: Python (2.6 or greater)

Installation
------------

- pip (recommended)

  `pip install grokcli`

- easy_install

  `easy_install grokcli`

- setup.py

  `python setup.py install`

Usage
-----

Grok CLI tools provides a single, high-level `grok` command, from which
a number of sub-commands can be invoked:

    grok [command] [options]

- `grok credentials`

  Use the `grok credentials` sub-command to add your AWS credentials to a
  running Grok server configuration:

      grok credentials SERVER_URL [options]

  The `SERVER_URL` positional argument is required and must be a url to a
  running Grok server.  For example: https://ec2-AA-BB-CC-DD.us-west-2.compute.amazonaws.com

  You can specify your credentials in one of three ways:

  - Specify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` CLI options.

    ```
    grok credentials SERVER_URL --AWS_ACCESS_KEY_ID=... --AWS_SECRET_ACCESS_KEY=...
    ```

  - Read AWS credentials from a specific file using the `-d`, or `--data` CLI
    options.

    ```
    grok credentials SERVER_URL -d PATH_TO_FILE
    grok credentials SERVER_URL --data=PATH_TO_FILE
    ```

    You can read from stdin using `-`:

    ```
    grok credentials SERVER_URL -d - < PATH_TO_FILE
    grok credentials SERVER_URL --data=- < PATH_TO_FILE
    ```

    The credentials file should be formatted according to this template:

    ```
    AWS_ACCESS_KEY_ID=Your AWS access key ID here
    AWS_SECRET_ACCESS_KEY=Your AWS secret access key here
    ```

  - Use existing boto configuration.

    ```
    grok credentials SERVER_URL --use-boto
    ```

- `grok export`

  Export Grok model definitions to a file in JSON or YAML format.

      grok export SERVER_URL GROK_API_KEY [options]

  The `SERVER_URL` positional argument is required and must be a url to a
  running Grok server.  For example: https://ec2-AA-BB-CC-DD.us-west-2.compute.amazonaws.com

  The `GROK_API_KEY` positional argument is also required, and can be retrieved
  from the web interface of a running Grok server.

  By default, `grok export` prints output to stdout, which can be directed to a
  file:

      grok export SERVER_URL GROK_API_KEY > file.json

  However, you can optionally specify a file using the `-o` or `--output` CLI
  option:

      grok export SERVER_URL GROK_API_KEY -o file.json
      grok export SERVER_URL GROK_API_KEY --output=file.json

  Use the `-y` or `--yaml` CLI flag to save output in YAML format

      grok export SERVER_URL GROK_API_KEY -y
      grok export SERVER_URL GROK_API_KEY --yaml

- `grok import`

  Import Grok model definitions into a Grok server from a local file.

      grok import SERVER_URL GROK_API_KEY [FILE] [options]

  The `SERVER_URL` positional argument is required and must be a url to a
  running Grok server.  For example: https://ec2-AA-BB-CC-DD.us-west-2.compute.amazonaws.com

  The `GROK_API_KEY` positional argument is also required, and can be retrieved
  from the web interface of a running Grok server.

  The `FILE` positional argument is optional, however if it is not specified,
  `grok import` will assume `STDIN` if `-d` or `--data` is not specified.  The
  following are equivalent:

      grok import SERVER_URL GROK_API_KEY file.json
      grok import SERVER_URL GROK_API_KEY < file.json
      grok import SERVER_URL GROK_API_KEY -d file.json
      grok import SERVER_URL GROK_API_KEY --data=file.json

  `grok import` supports files in YAML format, if pyyaml is installed and
  available on the system.

- `grok (DELETE|GET|POST)`

  Included in the Grok CLI tool is a lower-level direct API which translates
  CLI options to direct HTTP calls into the Grok web service.  For example, to
  get all available cloudwatch metrics:

      grok GET SERVER_URL/_metrics/cloudwatch GROK_API_KEY

  For `grok POST` and `grok DELETE`, where request data may be required, such
  data can be specified either via the `-d`, or `--data` CLI option, or
  supplied via STDIN:

      grok POST SERVER_URL/_models GROK_API_KEY < model-definition.json
      grok POST SERVER_URL/_models GROK_API_KEY -d model-definition.json
      grok POST SERVER_URL/_models GROK_API_KEY --data model-definition.json

- `grok metrics`

  View available metrics.

      grok metrics SERVER_URL GROK_API_KEY [options]

  CLI options include:

   Option     | Description
  ------------|-----------------------------------------------------------
   datasource | Grok datasource (e.g. "cloudwatch", "custom")
   metric     | CloudWatch metric name
   namespace  | AWS CloudWatch namespace
   region     | AWS Region

  To get a list of available cloudwatch metrics:

      grok metrics SERVER_URL GROK_API_KEY --datasource=cloudwatch

  Limiting to CloudWatch metrics in a specific AWS region:

      grok metrics SERVER_URL GROK_API_KEY \
        --datasource=cloudwatch \
        --region=REGION

  Limiting to CloudWatch metrics in a specific AWS region and namespace:

      grok metrics SERVER_URL GROK_API_KEY \
        --datasource=cloudwatch \
        --region=REGION \
        --namespace=NAMESPACE

  Limiting to CloudWatch metrics in a specific AWS region, namespace and metric:

      grok metrics SERVER_URL GROK_API_KEY \
        --datasource=cloudwatch \
        --region=REGION \
        --namespace=NAMESPACE \
        --metric=METRIC

  For example, to list the AWS/EC2 CPUUtilization metrics in us-west-2:

      grok metrics SERVER_URL GROK_API_KEY \
        --datasource=cloudwatch \
        --region=us-west-2 \
        --namespace=AWS/EC2 \
        --metric=CPUUtilization

- `grok cloudwatch add`

  Create Grok model for CloudWatch metric.

      grok cloudwatch add SERVER_URL GROK_API_KEY [options]

  CLI options include:

   Option     | Description
  ------------|-----------------------------------------------------------
   metric     | CloudWatch metric name
   namespace  | AWS CloudWatch namespace
   region     | AWS Region
   dimensions | Cloudwatch dimension name-value pair (separated by space)

  For example:

      grok cloudwatch add SERVER_URL/_models GROK_API_KEY \
        --metric=CPUUtilization \
        --namespace=AWS/EC2 \
        --region=us-west-2 \
        --dimensions InstanceId i-abc123


*Note to developers:*

To add a command, create a python module in
[grokcli/commands/](grokcli/commands) with a `handle()` function which accepts
two arguments: `options`, and `args`.  Register the command by importing the
module in [grokcli/commands/\_\_init\_\_.py](grokcli/commands/__init__.py) and
adding it to `__all__`.
