var logger = require('../logger.js');
var raspbian = require("./raspbian.js");

var version;

var console = logger.logger;


var wifis = require('../wireless-wifi-finder.js');
var environment = require('../environment-parser.js');

var container;

function init(options,callback) {
	//exec lsb_release -a to detect version
	// OUTPUT :
	// No LSB modules are available.
	// Distributor ID:	Raspbian
	// Description:	Raspbian GNU/Linux 8.0 (jessie)
	// Release:	8.0
	// Codename:	jessie

	environment.make_tmp_dir(options,function handle_error(err,data){
		if(err){
			console.error(err);
		}
		environment.parse_environment(options,function handle_error(err,data){
			if(err){
				console.error(err);
			}
			version = data;
			switch(version){
				case "Raspbian":	
					console.info("Found Raspbian");
					raspbian.init(options);
					wifis.start_wireless_finder(options);
					setupAP(options,function handle_error(err,data){
						if(err){
							console.error(err);
						}
					});
					callback(null,'done');
					break;
				default:
					console.error("Environment not detected");
					break;
			}
		});
	});
		

}

function pingNetworks(callback){
	console.debug("pinging networks for module " + version);
	var serial;
	var gateway_eth0;
	var gateway_wlan0;
	
	var ip_eth0;
	var ip_wlan0;
	
	switch(version){
	case "Raspbian":
		environment.get_pi_serial(function(err,data){
			if(err){
				console.error(err);
			}else{
				serial = data;
			}
		});
		environment.get_gateway_for_interface("eth0",function(err,data){
			if(err){
				console.error(err);
			}else{
				gateway_eth0 = data;
			}
		});
		
		environment.get_gateway_for_interface("wlan0",function(err,data){
			if(err){
				console.error(err);
			}else{
				gateway_wlan0 = data;
			}
		});
		
		environment.get_ip_for_interface("eth0",function(err,data){
			if(err){
				console.error(err);
			}else{
				ip_eth0 = data;
			}
		});
		
		environment.get_ip_for_interface("wlan0",function(err,data){
			if(err){
				console.error(err);
			}else{
				ip_wlan0 = data;
			}
		});
		
		var container = {"serial":serial,"gatewayeth0":gateway_eth0,"gatewaywlan0":gateway_wlan0,"ipwlan0":ip_wlan0,"ipeth0":ip_eth0,"type":version};
		callback(null,container);
		break;
	}
}

function setupAP(options){
	//select appropriate version
	switch(version){
		case "Raspbian":
			console.info("Installing AP")
			raspbian.setupAP(options,function handle_error(err,data){
				if(err){
					console.error(err);
				}
			});
			break;
		default:
			console.error("Environment not detected during AP installation");
			break;
	}
}

function scanForWifi(callback) {
	//select appropriate version
	switch(version){
		case "Raspbian":
			//console.info("Getting wifi container values");
			raspbian.scanForWifi(callback);
			break;
		default:
			console.error("Environment not detected during wifiscan");
			break;
	}
}

function connectToWifi(ssid,passphrase,options,callback){
	//select appropriate version
	switch(version){
		case "Raspbian":
			console.info("Connecting to ssid : " + ssid);
			console.info("with passprhase : " + passphrase);
			raspbian.connectToWifi(ssid,passphrase,options,function handle_error(err,data){
				if(err){
					callback(err,null);
				}
				callback(null,data);
			});
			break;
		default:
			console.error("Environment not detected while connecting to wifi");
			break;
	}
	return false;
}



exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;
exports.pingNetworks = pingNetworks;
exports.container = container;
