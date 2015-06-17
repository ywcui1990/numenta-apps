FROM numenta/nupic:latest
RUN apt-get install -y default-jre-headless
ADD . /opt/dynamodb_test_tool
WORKDIR /opt/dynamodb_test_tool
RUN mkdir -p /root/.dynamodb
EXPOSE 8300
ENV DYNAMODB_PORT 8300
CMD java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -port ${DYNAMODB_PORT} -dbPath /root/.dynamodb
