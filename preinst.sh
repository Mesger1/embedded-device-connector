#!/bin/sh

apt-get install hostapd dnsmasq -y
wget https://nodejs.org/dist/v4.3.2/node-v4.3.2-linux-armv6l.tar.gz 
tar -xvf node-v4.3.2-linux-armv6l.tar.gz > /dev/null 2>&1
cd node-v4.3.2-linux-armv6l
sudo cp -R * /usr/local/ > /dev/null 2>&1
cd ..
