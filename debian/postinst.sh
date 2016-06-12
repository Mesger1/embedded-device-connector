#!/bin/bash

echo "/etc/resolv.conf"
echo "removing file"
sudo rm -rf /etc/resolv.conf
echo "Creating File"
cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF

npm install https://github.com/gerdmestdagh/embedded-device-connector.git -g

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

PID=`ps -ef | grep node | grep -v "grep" | awk '{print $2}'`
#to check PID is right
if [ -z "$PID" ]; then
    echo "No Node Server Running"
    else
	kill -9 $PID
fi

echo "adding server startup to rc.local"
sed -i 's/wifi-connector//g' /etc/rc.local
sed -i 's/exit 0/wifi-connector &\nexit 0/g' /etc/rc.local
sudo wifi-connector &
exit 0  
