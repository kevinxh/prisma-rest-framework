#!/bin/sh

docker run \
    --name db \
    -p 5432:5432 \
    -e POSTGRES_USER=user \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=db \
    -d \
    postgres:14
