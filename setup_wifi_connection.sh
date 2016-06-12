#!/bin/bash
name="wifi-connector:setup_wifi_connection"
exec 1> >(logger -s -t $(basename $name)) 2>&1

sudo cp /etc/resolv.conf /etc/resolv.conf.orig
sudo ./reset_apn.sh
sudo cp /etc/wpa_supplicant/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf.orig
cat > /etc/wpa_supplicant/wpa_supplicant.conf << EOF
network={
    ssid="$1"
    psk="$2"
}
EOF
PID=`ps -ef | grep hostapd | grep -v "grep" | awk '{print $2}'`
#to check PID is right
if [ -z "$PID" ]; then
    echo "No hostapd process running"
        else
        kill -9 $PID
fi

sudo service dhcpcd restart
echo "service dhcpcd restarted"
sudo ifdown wlan0
sudo ifup wlan0
sudo ifconfig wlan0 down
sudo ifconfig wlan0 up
echo "wlan0 interface resetted"


echo "waiting for ip ..."

GATEWAY=`route -n | awk '{if($8=="wlan0" && $4=="UG") print $2}'`
i=0
while [ -z "$GATEWAY" ]
do
  sudo ifconfig wlan0 down 
  sudo ifconfig wlan0 up
  echo "querying gateway ..."
  sleep 20s
  GATEWAY=`route -n | awk '{if($8=="wlan0" && $4=="UG") print $2}'`
  if [ "$i" -gt 1 ]; then
	break
  fi
  i=`expr $i + 1`
  if [ -z "$GATEWAY" ]; then
        echo "retrying"
    else
    break
  fi
done


if [ -z "$GATEWAY" ]; then
        echo "gateway not found"
else
        echo "gateway found"
        wget -q --tries=10 --timeout=60 --spider $GATEWAY
        if [[ $? -eq 0 ]]; then

                echo "removing server startup from rc.local"
                sed -i 's/wifi-control//g' /etc/rc.local
                
                echo "WIFI SETUP CORRECTLY"
                
                PID=`ps -ef | grep node | grep -v "grep" | awk '{print $2}'`
                if [ -z "$PID" ]; then
                    echo "No node process running"
                        else
                        echo "server killed"
                        kill -9 $PID
                        
                fi
                exit 0
        fi
fi
echo "WIFI SETUP INCORRECTLY"
sudo mv /etc/wpa_supplicant/wpa_supplicant.conf.orig /etc/wpa_supplicant/wpa_supplicant.conf
echo "reinstalling accesspoint"
exit 1
