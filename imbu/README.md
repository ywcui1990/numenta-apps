# Numenta Imbu

> Application to demonstrate HTM NLP functionality on survey data.

>This application is based on Numenta [Unicorn application](https://github.com/numenta/numenta-apps/tree/master/unicorn) and  [Nupic Fluent](https://github.com/numenta/nupic.fluent).

# License

  AGPLv3. See [LICENSE.txt](LICENSE.txt)

## UNDER HEAVY DEVELOPMENT

### Setup

```shell
brew install git node nginx # darwin
git clone https://github.com/numenta/numenta-apps
cd numenta-apps/imbu
npm install
python setup.py install
```

#### Cortical.io Setup

1. Get [cortical.io](http://www.cortical.io/) API key from http://www.cortical.io/resources_apikey.html
1. Create `CORTICAL_API_KEY` environment variable with your new API key.
1. Create `IMBU_RETINA_ID` environment variable with the name of the *retina* to use.

## Running

Change working directory to `numenta-apps/imbu`:

```shell
cd numenta-apps/imbu
```

Build Web App:

```shell
npm run pack-web
```

Start `nginx`:

```shell
sudo nginx -p . -c conf/nginx-fluent.conf
```

Start `Fluent API` services:

```shell
mkdir -p logs
supervisord -c conf/supervisord.conf
```

Open application from this URL: http://localhost:8080

## Docker

In the root of `numenta-apps/imbu`:

```
cp /your/formatted/data.csv engine/data.csv
docker build -t imbu:latest .
docker run --name imbu -d -p 8080:80 -e CORTICAL_API_KEY=${CORTICAL_API_KEY} -e IMBU_RETINA_ID=${IMBU_RETINA_ID} imbu:latest
```

Open application from this URL: http://localhost:8080
