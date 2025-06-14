#!/bin/bash

#Helper script to build and optionally push a Docker image

VERSION=`npm pkg get version | tr -d '"'`
PUSH=false
BUILD=false

for arg in "$*"
do
    if [[ "$arg" == "--push" ]]; then
        PUSH=true
    elif [[ "$arg" == "--build" ]]; then
        BUILD=true
    fi
done

if [ "$BUILD" = true ]; then
    echo "Building Docker image..."
    docker build -t ivaccari/barcode-scanner:$VERSION -t ivaccari/barcode-scanner:latest .
else
    echo "Skipping Docker image build."
fi


if [ "$PUSH" = true ]; then
    echo "Pushing Docker image..."
    
    git tag
    docker push -t ivaccari/barcode-scanner:$VERSION
fi