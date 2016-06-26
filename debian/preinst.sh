#!/bin/sh

sed -i 's/dns-nameservers 8.8.8.8 8.8.4.4//g' /etc/rc.local
sed -i '$ i\dns-nameservers 8.8.8.8 8.8.4.4' /etc/rc.local


