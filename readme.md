#WIFI ACCESS POINT CONFIGURATOR

update sources.list for node 5.x apt-get :
- curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -

Build debian package :
- sudo ./build_deb_package.sh ${VERSION}

Install debian package : 
- sudo dpkg -i embedded-device-connector-${VERSION}.deb
- sudo apt-get -f install





