#!/bin/sh
sudo rm -rf /etc/resolv.conf
cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF
