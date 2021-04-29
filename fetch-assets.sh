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

cd "$(dirname $0)"

rm -rf assets/js
mkdir -p assets/js assets/css
if [ "$mode" == "prod" ]; then
    wget "https://unpkg.com/react@${reactjs_version}/umd/react.production.min.js" -N -O assets/js/react.js
    wget "https://unpkg.com/react-dom@${reactjs_version}/umd/react-dom.production.min.js" -N -O assets/js/react-dom.js
elif [ "$mode" == "dev" ]; then 
    wget "https://unpkg.com/react@${reactjs_version}/umd/react.development.js" -N -O assets/js/react.js
    wget "https://unpkg.com/react-dom@${reactjs_version}/umd/react-dom.development.js" -N -O assets/js/react-dom.js
fi

wget https://stackpath.bootstrapcdn.com/bootstrap/${bootstrap_version}/css/bootstrap.min.css -P assets/css/
wget https://raw.githubusercontent.com/enguerrand/reactjs-helpers/master/reactjs-helpers.js -P assets/js/
