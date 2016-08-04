var options = require('./options.js');
var Wireless = require('wireless'); 
var wireless; 

var logger = require('./logger.js');
var console = logger.logger;

var networks = []; 

function start_wireless_finder(){
	wireless = new Wireless({
	    iface: options.INTERFACE,
		updateFrequency: 10, // Optional, seconds to scan for networks
		connectionSpyFrequency: 10, // Optional, seconds to scan if connected
		vanishThreshold: 10 // Optional, how many scans before network considered gone
	});
	
	wireless.enable(function(error) {
	    if (error) {
	        console.error("Unable to enable wireless card. Quitting...");
	        return;
	    }
	    console.info("Wireless card enabled.");
	    console.info("Starting wireless scan...");
	    wireless.start();
	});
	
	//log errors
	wireless.on('error', function(error) {
		console.error("Wireless error : " + error);
	});
	
	// Found a new network
	wireless.on('appear', function(network) {
	    var quality = Math.floor(network.quality / 70 * 100);
	    var ssid = network.ssid || '<HIDDEN>';
	    var encryption_type = 'NONE';
	    if (network.encryption_wep) {
	        encryption_type = 'WEP';
	    } else if (network.encryption_wpa && network.encryption_wpa2) {
	        encryption_type = 'WPA&WPA2';
	    } else if (network.encryption_wpa) {
	        encryption_type = 'WPA';
	    } else if (network.encryption_wpa2) {
	        encryption_type = 'WPA2';
	    }
		console.info("[APPEAR] " + ssid + " [" + network.address + "] " + quality + "% " + 
network.strength + " dBm " + encryption_type);
		var add = true;
		for(var i = 0;i<networks.length;i++){
			if(networks[i].ssid === network.ssid){
					add = false;
			}
		}
		if(add){
			networks.push(network);
		}
	});
	//network dissapeared
	wireless.on('vanish', function(network) {
	    var quality = Math.floor(network.quality / 70 * 100);
	    var ssid = network.ssid || '<HIDDEN>';
	    var encryption_type = 'NONE';
	    if (network.encryption_wep) {
	        encryption_type = 'WEP';
	    } else if (network.encryption_wpa && network.encryption_wpa2) {
	        encryption_type = 'WPA&WPA2';
	    } else if (network.encryption_wpa) {
	        encryption_type = 'WPA';
	    } else if (network.encryption_wpa2) {
	        encryption_type = 'WPA2';
	    }
		console.info("[VANISH] " + ssid + " [" + network.address + "] " + quality + "% " + 
network.strength + " dBm " + encryption_type);
		for(var i = 0;i<networks.length;i++){
			if(networks[i].address === network.address){
				networks.splice(i,1);
			}
		}
	});
}

exports.networks = networks;
exports.start_wireless_finder = start_wireless_finder;