#!/bin/bash
cd $(dirname $0)
export PYTHONPATH="$(pwd):$(pwd)/tests:$(pwd)/venv/lib/python3.9/site-packages/"
source ./venv/bin/activate
cd ./tests
coverage3 run -m unittest discover .
coverage3 report -m
