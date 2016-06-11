#!/bin/bash
VERSION = $1
rm -rf embedded-device-connector-*
mkdir embedded-device-connector-${VERSION}
mkdir embedded-device-connector-${VERSION}/DEBIAN
cp control embedded-device-connector-${VERSION}/DEBIAN
#cp preinst.sh ./embedded-device-connector-1.0/DEBIAN/preinst
#cp postinst.sh ./embedded-device-connector-1.0/DEBIAN/postinst
dpkg-deb --build embedded-device-connector-${VERSION}/

