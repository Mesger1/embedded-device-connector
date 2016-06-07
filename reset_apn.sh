#!/bin/bash

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

echo "================================================="
echo "/etc/dhcpcd.conf"
echo "resetting file"
sudo mv /etc/dhcpcd.conf.orig /etc/dhcpcd.conf

echo "================================================="
echo "/etc/network/interfaces"
echo "backing up "
sudo cp /etc/network/interfaces.orig /etc/network/interfaces

echo "================================================="
echo "/etc/hostapd/hostapd.conf"
echo "removing file"
rm -rf /etc/hostapd/hostapd.conf

echo "================================================="
echo "/etc/default/hostapd"
echo "removing File"
sudo mv /etc/default/hostapd.orig /etc/default/hostapd


echo "================================================="
echo "/etc/dnsmasq.conf"
echo "removing file"
sudo rm -rf /etc/dnsmasq.conf
sudo "create empty dnsmasq file"
sudo touch /etc/dnsmasq.conf


echo "================================================="
echo "starting hostapd ..."
sudo service hostapd stop
echo "hostapd stopped !"
echo "starting dnsmasq ..."
sudo service dnsmasq stop
echo "dnsmasq stopped !"

echo "================================================="
echo ""
echo "All done!"