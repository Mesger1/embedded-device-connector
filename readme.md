#WIFI ACCESS POINT CONFIGURATOR

Build debian package :
- sudo ./build_deb_package.sh ${VERSION}

update sources.list for node 5.x apt-get :
- curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -

Install debian package : 
- sudo dpkg -i embedded-device-connector-${VERSION}.deb
- sudo apt-get -f install


tail output with :
- tail -f /var/log/syslog | grep wifi-connector



