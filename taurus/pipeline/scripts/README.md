A set of helper scripts are provided to automate the process of initializing,
updating, and refreshing a pair of Taurus Server and Taurus Metric Collector
instances:
- initialize-remote-taurus-servers.sh
- update-remote-taurus-servers.sh
- refresh-remote-taurus-servers.sh

Usage
-----

The above scripts make several assumptions about the state of the instances
in use.  In particular, that a baseline set of requirements are satisfied and
that the instances are capable of being used without further manual
modification.  Internally, Numenta uses some tooling to launch and configure
AWS EC2 instances that meet the requirements.

Run `./initialize-remote-taurus-servers.sh -h` for a comprehensive list of
required environment variables needed for initializing a pair of servers to run
Taurus.
