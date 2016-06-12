#!/bin/bash

echo "/etc/resolv.conf"
echo "removing file"
sudo rm -rf /etc/resolv.conf
echo "Creating File"
cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF


mkdir /usr/local/wifi-connector
cd /usr/local/wifi-connector
npm install https://github.com/gerdmestdagh/embedded-device-connector.git
cd node_modules
cd embedded-device-connector

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

PID=`ps -ef | grep server.js | grep -v "grep" | awk '{print $2}'`
#to check PID is right
if [ -z "$PID" ]; then
    echo "No Node Server Running"
    else
	kill -9 $PID
fi
sudo npm start
