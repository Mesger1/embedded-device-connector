#!/bin/bash

sed -i 's/dns-nameservers 8.8.8.8 8.8.4.4//g' /etc/network/interfaces
sed -i '${s/$/\ndns-nameservers 8.8.8.8 8.8.4.4/}' /etc/network/interfaces


