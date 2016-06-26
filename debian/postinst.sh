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

echo "adding server startup to rc.local"
sed -i '$ i\sudo wifi-connector' /etc/rc.local

sudo wifi-connector

exit 0  
