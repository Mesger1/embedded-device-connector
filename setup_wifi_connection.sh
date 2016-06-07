#!/bin/bash

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi
if [[ $# -ne 2 ]]
        then echo "You need to enter an essid and a passphrase!"
        echo "sudo $0 essid passphrase"
        exit
fi

echo "backing up resolv file"
sudo cp /etc/resolv.conf /etc/resolv.conf.orig


sudo ./reset_apn.sh



echo "/etc/wpa_supplicant/wpa_supplicant.conf"
echo "backing up file"
sudo cp /etc/wpa_supplicant/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf.orig
echo "adjusting file"
cat > /etc/wpa_supplicant/wpa_supplicant.conf << EOF
network={
    ssid="$1"
    psk="$2"
}
EOF

PID=`ps -ef | grep hostapd | grep -v "grep" | awk '{print $2}'`
echo $PID
#to check PID is right
if [ -z "$PID" ]; then
    echo "No hostapd process running"
        else
        kill -9 $PID
fi

echo "putting back resolv file"
sudo mv /etc/resolv.conf.orig /etc/resolv.conf

echo "/etc/resolv.conf"
echo "removing file"
sudo rm -rf /etc/resolv.conf
echo "Creating File"
cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF


echo "restarting dhcpcd ..."
sudo service dhcpcd restart
echo "dhcpcd restarted !"
echo "resetting wlan0"
sudo ifdown wlan0
sudo ifup wlan0
sudo ifconfig wlan0 down
sudo ifconfig wlan0 up



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
  if [ "$i" -gt 2 ]; then
	break
  fi
  i=`expr $i + 1`
done


if [ -z "$GATEWAY" ]; then
        echo "gateway not found"
else
        echo "gateway found"
fi

wget -q --tries=10 --timeout=60 --spider $GATEWAY
if [[ $? -eq 0 ]]; then
        echo "WIFI SETUP CORRECTLY"
		PID=`ps -ef | grep node | grep -v "grep" | awk '{print $2}'`
		echo $PID
		#to check PID is right
		if [ -z "$PID" ]; then
			echo "No hostapd process running"
				else
				kill -9 $PID
		fi

else
        echo "WIFI SETUP INCORRECTLY"
                echo "/etc/wpa_supplicant/wpa_supplicant.conf"
                echo "resetting file"
                sudo mv /etc/wpa_supplicant/wpa_supplicant.conf.orig /etc/wpa_supplicant/wpa_supplicant.conf
                echo "reinstalling apn !"
                sudo ./setup_wifi_apn.sh
fi




echo "All done"
exit 0
