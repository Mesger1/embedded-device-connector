npm install https://github.com/gerdmestdagh/embedded-device-connector.git
cd node_modules
cd embedded-device-connector
#!/bin/bash

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

PID=`ps -ef | grep node_server.js | grep -v "grep" | awk '{print $2}'`
echo $PID
#to check PID is right
if [ -z "$PID" ]; then
    echo "No Node Server Running"
    else
	kill -9 $PID
fi
npm start &
