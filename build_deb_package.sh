#!/bin/bash
rm -rf embedded-device-connector-1.0
mkdir embedded-device-connector-1.0
mkdir embedded-device-connector-1.0/DEBIAN
cp control embedded-device-connector-1.0/DEBIAN
cp preinst.sh ./embedded-device-connector-1.0/DEBIAN/preinst
cp postinst.sh ./embedded-device-connector-1.0/DEBIAN/postinst
dpkg-deb --build embedded-device-connector-1.0/

