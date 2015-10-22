# Numenta Unicorn: Backend Model Runner

This `backend/` directory is for ModelRunner and Support (Python / C++).
It's functionality is exposed to the user via GUI and Model Management code
contained in the sibling `../frontend/` directory.

See: `requirements.txt`


## Example usage
To generate mock data and feed it to the model runner, run:
```
 python unicorn_backend/mock_data_generator.py | python unicorn_backend/model_runner.py --model "1" --stats '{"max": 10, "min": 0}'
```

This will output the model output to stdout.

Note that simply running `python unicorn_backend/mock_data_generator.py` will just generate the data input. When you pipe the two scripts together (`mock_data_generator.py` to `model_runner.py`) this will feed the data input to the model runner via stdout and in turn, it outputs the model results to stdout.

## Tests

Run unit and integration tests w/ `python setup.py test`
