#!/bin/bash

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

wget -q --tries=10 --timeout=20 --spider http://google.com
if [[ $? -eq 0 ]]; then
        echo "Connected to Internet"
else
        echo "Error no internet connection"
                exit
fi

sudo apt-get install hostapd dnsmasq -y



#editing /etc/dhcpcd.conf
FILE="/etc/dhcpcd.conf"
PATTERN="172.24.1.1/24"
echo "checking file '$FILE'"
if grep -q $PATTERN $FILE
        then
            echo "static IP already configured"
        else
			echo "making backup ..."
			cp $FILE $FILE.orig
			echo "modifying '$FILE'"
			echo "Creating File : Adding static IP"
cat > $FILE <<EOF
interface wlan0
        static ip_address=172.24.1.1/24
EOF
fi

#editing network interfaces			
FILE="/etc/network/interfaces"
PATTERN="iface wlan0"
echo "checking file '$FILE'"
NEXTLINE=$(egrep -A1 "$PATTERN" $FILE)
PATTERN="#   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf"
if [[ $NEXTLINE == *"#   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf"* ]]
        then
                echo "File OK .."
        else
			echo "making backup ..."
			cp $FILE $FILE.orig
            echo "modifying '$FILE'"
            sed -i '/iface wlan0/{n;s/.*/#   wpa-conf \/etc\/wpa_supplicant\/wpa_supplicant.conf/}' $FILE
fi



echo "================================================="
echo "/etc/wpa_supplicant/wpa_supplicant"
echo "Removing"
sudo rm -rf /etc/wpa_supplicant/wpa_supplicant
echo "adding empty wpa_supplicants file"
sudo touch /etc/wpa_supplicant/wpa_supplicant

echo "================================================="
echo "Restarting dhcpcd ..."
sudo service dhcpcd restart
echo "dhcpcd restarted !"


echo "================================================="
echo "/etc/hostapd/hostapd.conf"
sudo mkdir /etc/hostapd
sudo touch /etc/hostapd/hostapd.conf
rm -rf /etc/hostapd/hostapd.conf
echo "Creating File"
cat > /etc/hostapd/hostapd.conf <<EOF
# This is the name of the WiFi interface we configured above
interface=wlan0
driver=nl80211
ssid=Pi3-AP
channel=1
EOF

# echo "================================================="
# echo "testing hostapd file..."
# sudo /usr/sbin/hostapd /etc/hostapd/hostapd.conf
# echo "testing done !"


PATTERN='DAEMON_CONF="/etc/hostapd/hostapd.conf"'
FILE="/etc/default/hostapd"

echo "checking file '$FILE'"
if grep -q $PATTERN $FILE;
 then
     echo "File OK"
 else
     echo "making backup ..."
     cp $FILE $FILE.orig
     echo "modifying '$FILE'"
     sed -i "s/DAEMON_CONF=\"\"/DAEMON_CONF=\"\/etc\/hostapd\/hostapd.conf\"/" $FILE
fi


echo "/etc/dnsmasq.conf"
echo "removing file"
sudo rm -rf /etc/dnsmasq.conf
echo "Creating File"
cat > /etc/dnsmasq.conf << EOF
interface=wlan0      # Use interface wlan0
bind-interfaces      # Bind to the interface to make sure we aren't sending things elsewhere
server=8.8.8.8       # Forward DNS requests to Google DNS
domain-needed        # Don't forward short names
bogus-priv           # Never forward addresses in the non-routed address spaces.
dhcp-range=172.24.1.50,172.24.1.150,12h # Assign IP addresses between 172.24.1.50 and 172.24.1.150 with a 12 hour lease time
EOF

PID=`ps -ef | grep hostapd | grep -v "grep" | awk '{print $2}'`
echo $PID
#to check PID is right
if [ -z "$PID" ]; then
    echo "No hostapd process Running"
	else
	kill -9 $PID
fi

sudo ifconfig wlan0 up 0.0.0.0

echo "================================================="
echo "starting hostapd ..."
sudo service hostapd restart
echo "hostapd started !"
echo "starting dnsmasq ..."
sudo service dnsmasq restart
echo "dnsmasq started !"


sudo ifconfig wlan0 up 172.24.1.1

echo "================================================="
echo "starting hostapd ..."
sudo service hostapd restart
echo "hostapd started !"
echo "starting dnsmasq ..."
sudo service dnsmasq restart
echo "dnsmasq started !"

sudo ifdown wlan0
sudo ifup wlan0

sudo /usr/sbin/hostapd /etc/hostapd/hostapd.conf  > /dev/null &

echo "================================================="
echo ""
echo "All done!"
