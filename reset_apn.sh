#!/bin/bash

if [ "$EUID" -ne 0 ]
        then echo "Must be root"
        exit
fi

sudo mv /etc/dhcpcd.conf.orig /etc/dhcpcd.conf
sudo cp /etc/network/interfaces.orig /etc/network/interfaces
rm -rf /etc/hostapd/hostapd.conf
sudo mv /etc/default/hostapd.orig /etc/default/hostapd
sudo rm -rf /etc/dnsmasq.conf
sudo touch /etc/dnsmasq.conf
sudo service hostapd stop
sudo service dnsmasq stop
echo "AP Configs resetted" 