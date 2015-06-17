FROM htmengine:latest
ADD . /opt/numenta/taurus.metric_collectors
WORKDIR /opt/numenta/taurus.metric_collectors
RUN python setup.py develop --install-dir=/usr/local/lib/python2.7/site-packages --script-dir=/usr/local/bin
ENV APPLICATION_CONFIG_PATH /opt/numenta/taurus.metric_collectors/conf
RUN mkdir -p /opt/numenta/taurus.metric_collectors/logs
EXPOSE 8001
CMD ./docker/taurus.metric_collectors/run-taurus.metric_collectors.sh
