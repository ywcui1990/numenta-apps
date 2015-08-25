# Numenta Imbu

> Application to demonstrate HTM NLP functionality on survey data.

>This application is based on Numenta [Unicorn application](https://github.com/numenta/numenta-apps/tree/master/unicorn) and  [Nupic Fluent](https://github.com/numenta/nupic.fluent).

# License

  AGPLv3. See [LICENSE.txt](LICENSE.txt)

## UNDER HEAVY DEVELOPMENT

## Development

### Setup

```shell
brew install git node  # darwin
git clone https://github.com/numenta/numenta-apps
cd numenta-apps/imbu
npm install
pip install -r requirements.txt
```

Follow [Nupic Fluent](https://github.com/numenta/nupic.fluent#installation) installation instructions and add `nupic.fluent` to your `PYTHONPATH` to complete the installation.

```shell
export PYTHONPATH=$PYTHONPATH:<path to nupic.fluent>
```

## Running

Start fluent API:

```shell
python engine/fluent_api.py
```

Start app on local webserver, you can open it with Chrome Browser
at `http://localhost:9999`:

```shell
npm run dev
open http://localhost:9999
```
