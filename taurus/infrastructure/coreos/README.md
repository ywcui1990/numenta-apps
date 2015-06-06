Install dependencies
--------------------

* [VirtualBox](https://www.virtualbox.org/wiki/Downloads) 4.3.10 or greater.
* [Vagrant](http://www.vagrantup.com/downloads.html) 1.6 or greater.
* Docker Client that supports the `-f` arg (https://docs.docker.com/installation/mac/)

Startup
-------

From within the `docker-workshop` directory:

```
vagrant up
source env
```

``vagrant up`` triggers vagrant to download the CoreOS image (if necessary) and (re)launch the instance

Build and run Taurus Docker Image
---------------------------------

Taurus requires MySQL and RabbitMQ, so we'll run those daemons as separate
containers, and the full suite of taurus-specific supervisor services in
another.  We'll also be basing our taurus image on the official numenta/nupic
docker image to avoid building nupic.

In the root of `numenta-apps/`:

```
docker build -t taurus-server:latest -f Dockerfile-taurus .
docker build -t taurus-dynamodb:latest taurus/external/dynamodb_test_tool
```

Start MySQL container:

```
docker run \
  --name taurus-mysql \
  -e MYSQL_ROOT_PASSWORD=taurus \
  -p 3306:3306 \
  -d \
  mysql:5.6
```

Start RabbitMQ container:

```
docker run \
  --name taurus-rabbit \
  -e RABBITMQ_NODENAME=taurus-rabbit \
  -p 15672:15672 \
  -d \
  rabbitmq:3-management
```

Start Taurus DynamoDB container:

```
docker run \
  --name taurus-dynamodb \
  -e DYNAMODB_PORT=8300 \
  -p 8300:8300 \
  -d \
  taurus-dynamodb:latest
```

Start Taurus container:

```
docker run \
  --name taurus-server \
  --link taurus-rabbit:rabbit \
  -e RABBITMQ_HOST=rabbit \
  -e RABBITMQ_USER=guest \
  -e RABBITMQ_PASSWD=guest \
  --link taurus-mysql:mysql \
  -e MYSQL_HOST=mysql \
  -e MYSQL_USER=root \
  -e MYSQL_PASSWD=taurus \
  --link taurus-dynamodb:dynamodb \
  -e DYNAMODB_HOST=dynamodb \
  -e DYNAMODB_PORT=8300 \
  -p 8443:443 \
  -p 9001:9001 \
  -d \
  --privileged \
  taurus-server:latest
```

Inspect logs:

```
docker logs --tail=1000 -f taurus-server
```

*Note*: Supervisor configuration has been modified to log everything to stdout.

At this point, the full Taurus Server application is running in the VM, which
is only exposing the HTTPS interface on port `8443` and the supervisor api on
`9001`.  Should you need to connect to MySQL or Rabbit, you will either need to
modify `config.rb` and reload vagrant to expose those ports, or you may
establish an ssh tunnel using the following command(s).

To exchange keys:

```
vagrant ssh-config | sed -n "s/IdentityFile//gp" | head -n 1 | xargs ssh-add
```

Establish ssh tunnel:

```
vagrant ssh -- -L 3306:0.0.0.0:3306
```

Then, you can connect to localhost on port `3306` with a MySQL client.

