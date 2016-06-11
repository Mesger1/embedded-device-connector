#!/bin/bash
VERSION=$1
if [ -z "$1" ]; then
    echo "need to supply a version number (example: 1.0)"
    exit 0
fi
cd debian
rm -rf embedded-device-connector-*
rm -rf ../embedded-device-connector-*
mkdir embedded-device-connector-$VERSION
mkdir embedded-device-connector-$VERSION/DEBIAN
cp control embedded-device-connector-$VERSION/DEBIAN
#cp preinst.sh ./embedded-device-connector-1.0/DEBIAN/preinst
#cp postinst.sh ./embedded-device-connector-1.0/DEBIAN/postinst
dpkg-deb --build embedded-device-connector-$VERSION
mv embedded-device-connector-$VERSION.deb ../embedded-device-connector-$VERSION.deb

