# UPDATED INSTALL INSTRUCTIONS

update sources.list for node 5.x apt-get :
> curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -

install node js :
> sudo apt-get install nodejs

install hostapd and dnsmasq for setting up an accesspoint :
> sudo apt-get install hostapd dnsmasq

optionally : 
> sudo apt-get install lsb-core


install the nodejs connector app :
> sudo npm install 

run the connector app :
> sudo wifi https://github.com/gerdmestdagh/embedded-device-connector.git




# OLD WIFI ACCESS POINT CONFIGURATOR

Build debian package :
> sudo ./build_deb_package.sh ${VERSION}


sudo apt-get install lsb-core

update sources.list for node 5.x apt-get :
> curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -

Install debian package (the first command will give an error the following command solves that) : 
> sudo dpkg -i embedded-device-connector-${VERSION}.deb 

> sudo apt-get -f install 

how to use :
- connect to Pi3-AP without password 
- go to the select wifi page on http://192.168.3.1 


