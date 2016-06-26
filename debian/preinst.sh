#!/bin/sh
echo "/etc/resolv.conf"
echo "removing file"
sudo rm -rf /etc/resolv.conf
echo "Creating File"
cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF

curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
