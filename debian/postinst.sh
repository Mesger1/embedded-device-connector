#!/bin/bash

sudo rm -rf /etc/resolv.conf
cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

npm install https://github.com/gerdmestdagh/embedded-device-connector.git -g

echo "adding service startup to rc.local"
sudo cp /usr/lib/node_modules/embedded-device-connector/wifi-connector.service /etc/systemd/system/
sudo systemctl enable wifi-connector
sudo systemctl start wifi-connector

exit 0  
