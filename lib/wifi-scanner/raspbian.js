var logger = require('../logger.js');
var util = require('util');
var Wireless = require('wireless');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');
var sync = require('synchronize');
var config = require('../network-config-util.js');
var console = logger.logger;
var options = require('../options.js');


 options.AP_SSID = "Pi3";
 options.PASSPHRASE = "raspberry";

var networks = [];
var wireless;

var process;

var options;


function init() {
	
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
		console.error("Wireless error :  "  + error);
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
		console.info("[APPEAR] " + ssid + " [" + network.address + "] " + quality + "% " + network.strength + " dBm " + encryption_type);

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
		console.info("[VANISH] " + ssid + " [" + network.address + "] " + quality + "% " + network.strength + " dBm " + encryption_type);
		for(var i = 0;i<networks.length;i++){
			if(networks[i].address === network.address){
				networks.splice(i,1);
			}
		}
	});
}

function setupAP(callback){
	sync.fiber(function(){
		wireless.stop();
		
		config.backup_and_set_dhcpcd_conf(options,true);
		config.backup_and_set_network_interfaces(options,false);
		
		config.backup_and_set_dnsmasq_conf(options);
		console.debug("dnsmasq options set");
				
		config.backup_and_set_hostapd_conf(options);
		console.debug("hostapd options set");	
		
		if(config.isRunning("wpa")){
			exec("pkill","wpa");
		}

		exec("systemctl","daemon-reload");
		console.debug("daemon reloaded");
				
		exec("service" ," dhcpcd restart");
		console.debug("dhcpcd restarted");
				
		config.down(options,'0.0.0.0');
		console.debug("ifconfig down 0.0.0.0");
						
		config.up(options,'0.0.0.0');
		console.debug("ifconfig up 0.0.0.0");
				
		config.kill_dnsmasq_and_hostapd();
		console.debug("dnsmasq and hostapd killed");
				
		config.down(options,options.AP_IP_ADDRESS);
		console.debug("ifconfig down " + options.INTERFACE);
				
		config.up(options,options.AP_IP_ADDRESS);
		console.debug("ifconfig up " + options.INTERFACE);
				
		config.restart_dnsmasq_and_hostapd();
		console.debug("hostapd and dnsmasq restarted");

		if(!config.isRunning("hostapd")){
			exec("hostapd", "/etc/hostapd/hostapd.conf");
		}
	});
}

function scanForWifi(callback) {
	if(networks == null){
		callback(new Error("network container not inititalized"),null);
	}else{
		callback(null,networks);
	}
}


var child_process = require("child_process");

function exec(command,arguments){
	sync.fiber(function(){
		const spawn = child_process.spawnSync;
		const process = spawn(command, [arguments, '/usr'], {
			stdio: 'pipe',
			encoding: 'utf-8'
		});
		if(process.stderr){
			console.error(process.stderr);			
		}
		if(process.error){
			console.error(process.error);
		}
		if(process.stdout){
			console.debug(process.stdout);
		}
	});
}

function connectToWifi(ssid,passphrase){
	sync.fiber(function(){
		config.backup_and_set_dhcpcd_conf(options,false);
		
		config.kill_dnsmasq_and_hostapd();
		console.debug("hostapd and dnsmasq killed");
			
		if(config.isRunning("wpa")){
			exec("pkill","wpa");
			console.debug("wpa_supplicant killed");
		}
		exec("systemctl","daemon-reload");
		console.debug("daemon reloaded");
				
		exec("service","dhcpcd restart");
		console.debug("dhcpcd restarted");
					
		config.down(options,'0.0.0.0');
		console.debug("ifconfig down 0.0.0.0");
						
		config.up(options,'0.0.0.0');
		console.debug("ifconfig up 0.0.0.0");
		
		config.wpa_enable(options,ssid,passphrase);
		console.info("wpa being tested");
		
		exec("ifdown","wlan0");
		exec("ifup","wlan0");
		
	});
	return true;
}



exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;