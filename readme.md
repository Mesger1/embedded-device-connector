#WIFI ACCESS POINT CONFIGURATOR

copy all files to your pi 3's home directory

run from home directory (make all script executable) : 
	sudo chmod 755 *.sh

windows newline fix :
	sudo sed -i -e 's/\r$//' *.sh 

	
to setup node server with express and body-parser : 
	sudo ./setup_node_server 
	
to setup wifi access point "Pi3-AP" passwordless to preserve memory : 
	sudo ./setup_wifi_apn.sh

start node server : 
	sudo ./start_node_server.sh
	
when connected to the AP browse to : 
	172.24.1.1:3000
	
find your wifi network and enter your passphrase then hit connect



