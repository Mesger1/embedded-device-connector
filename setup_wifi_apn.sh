#!/bin/bash
name="wifi-connector:setup_wifi_ap"
exec 1> >(logger -s -t $(basename $name)) 2>&1

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi
#editing /etc/dhcpcd.conf
FILE="/etc/dhcpcd.conf"
PATTERN="192.168.3.1/24"
echo "checking file '$FILE'"
if grep -q $PATTERN $FILE
        then
            echo "static IP already configured"
        else
			echo "making backup ..."
			cp $FILE $FILE.orig
			echo "modifying '$FILE'"
			echo "Creating File : Adding static IP 192.168.3.1"
cat > $FILE <<EOF
interface wlan0
        static ip_address=192.168.3.1/24
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



sudo rm -rf /etc/wpa_supplicant/wpa_supplicant
sudo touch /etc/wpa_supplicant/wpa_supplicant

sudo systemctl daemon-reload

sudo service dhcpcd restart
echo "service dhcpcd restarted"

if [ -d "/etc/hostapd" ]; then
        sudo touch /etc/hostapd/hostapd.conf
    else
        sudo mkdir /etc/hostapd
fi
rm -rf /etc/hostapd/hostapd.conf
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
dhcp-range=192.168.3.50,192.168.3.150,12h # Assign IP addresses between 172.24.1.50 and 172.24.1.150 with a 12 hour lease time
EOF

PID=`ps -ef | grep hostapd | grep -v "grep" | awk '{print $2}'`
#to check PID is right
if [ -z "$PID" ]; then
    echo "No hostapd process Running"
	else
	kill -9 $PID
fi
sudo service hostapd restart
echo "service hostapd restarted"
sudo service dnsmasq restart
echo "service dnsmasq restarted"

sudo ifconfig wlan0 192.168.3.1

sudo service hostapd restart
echo "service hostapd restarted"
sudo service dnsmasq restart
echo "service dnsmasq restarted"

sudo ifdown wlan0
echo "wlan0 down"
sudo ifup wlan0
echo "wlan0 up"

sudo /usr/sbin/hostapd /etc/hostapd/hostapd.conf &
echo "hostapd config started"

