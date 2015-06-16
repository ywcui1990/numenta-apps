FROM htmengine:latest
RUN apt-get install -y nginx
ADD . /opt/numenta/taurus
WORKDIR /opt/numenta/taurus
RUN python setup.py develop --install-dir=/usr/local/lib/python2.7/site-packages --script-dir=/usr/local/bin
ENV APPLICATION_CONFIG_PATH /opt/numenta/taurus/conf
RUN mkdir -p /opt/numenta/taurus/logs
EXPOSE 443 9001
CMD ./docker/taurus/run-taurus.sh
