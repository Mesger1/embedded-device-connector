#!/bin/bash

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

npm install https://github.com/gerdmestdagh/embedded-device-connector.git -g &>/dev/null

echo "adding service wifi connector"
sudo pkill node
sudo cp /usr/lib/node_modules/embedded-device-connector/service/wifi-connector.service /etc/systemd/system/
sudo systemctl enable wifi-connector
sudo systemctl start wifi-connector

exit 0  
