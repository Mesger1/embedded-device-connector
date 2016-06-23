#WIFI ACCESS POINT CONFIGURATOR

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


