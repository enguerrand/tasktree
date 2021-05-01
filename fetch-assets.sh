#!/bin/bash

set -e

function print_usage(){
    echo "Usage: $(basename $0) prod|dev"
}

function abort(){
    echo "Error: $@" >&2
    print_usage
    exit -1
}

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    print_usage
    exit 0
fi

mode="$1"
[ -z "${mode}" ] && abort "Missing argument: mode"

reactjs_version=17.0.2
bootstrap_version=4.3.1
mdi_version=5.9.55

cd "$(dirname $0)"

rm -rf assets/*
mkdir -p assets/js assets/css assets/fonts
if [ "$mode" == "prod" ]; then
    wget "https://unpkg.com/react@${reactjs_version}/umd/react.production.min.js" -N -O assets/js/react.js
    wget "https://unpkg.com/react-dom@${reactjs_version}/umd/react-dom.production.min.js" -N -O assets/js/react-dom.js
elif [ "$mode" == "dev" ]; then 
    wget "https://unpkg.com/react@${reactjs_version}/umd/react.development.js" -N -O assets/js/react.js
    wget "https://unpkg.com/react-dom@${reactjs_version}/umd/react-dom.development.js" -N -O assets/js/react-dom.js
fi

wget https://stackpath.bootstrapcdn.com/bootstrap/${bootstrap_version}/css/bootstrap.min.css -P assets/css/
wget https://cdn.jsdelivr.net/npm/@mdi/font@${mdi_version}/css/materialdesignicons.min.css -P assets/css/
wget https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/${mdi_version}/fonts/materialdesignicons-webfont.woff2 -P assets/fonts
wget https://raw.githubusercontent.com/enguerrand/reactjs-helpers/master/reactjs-helpers.js -P assets/js/
