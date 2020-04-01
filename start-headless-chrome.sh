#!/bin/sh
docker run -e KEEP_ALIVE=true -e PREBOOT_CHROME=true -p 3000:3000 --restart always -d --name bc browserless/chrome