var exec = require('child_process').exec;
var util = require('util');
var Wireless = require('wireless');
var hostapd = require('wireless-tools/hostapd');
var ifconfig = require('wireless-tools/ifconfig');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');
var networks = [];
var wireless;


var options = {
	INTERFACE: 'wlan0',
	AP_IP_ADDRESS: '192.168.3.1',
	DHCP_RANGE: '192.168.3.50,192.168.3.150,12h',
	BROADCAST: '192.168.3.255',
	DRIVER: 'nl80211',
	AP_SSID: 'Pi3-AP'
}

function dnsmasq_enable(options, callback) {
  var file = options.interface + '-dnsmasq.conf';

  var commands = [
    'cat <<EOF >' + file + ' && dnsmasq --dhcp-optsfile=' + file 
  ];

  Object.getOwnPropertyNames(options).forEach(function(key) {
	  if(options[key]===''){
		  commands.push(key);
	  }else{
    	  commands.push(key + '=' + options[key]);
	  }
  });

  return exec(commands.join('\n'), callback);
}

function kill_dnsmasq_and_hostapd(callback){
	exec("pkill hostapd",function(err,data){
			console.log(data);
			exec("pkill dnsmasq",function(err,data){
					console.log(data);
					callback(null,"success")
			});
	});
}

function restart_dnsmasq_and_hostapd(callback){
	exec("/etc/init.d/hostapd restart",function(err,data){
			console.log(data);
			exec("/etc/init.d/dnsmasq restart",function(err,data){
					console.log(data);
					callback(null,"success")
			});
	});
}


function init(callback) {
	this.options = options;
	
	wireless = new Wireless({
	    iface: 'wlan0',
		updateFrequency: 2, // Optional, seconds to scan for networks
		connectionSpyFrequency: 2, // Optional, seconds to scan if connected
		vanishThreshold: 2 // Optional, how many scans before network considered gone
	});
	
	wireless.enable(function(error) {
	    if (error) {
	        console.log("[ FAILURE] Unable to enable wireless card. Quitting...");
	        return;
	    }

	    console.log("[PROGRESS] Wireless card enabled.");
	    console.log("[PROGRESS] Starting wireless scan...");

	    wireless.start();
	});
	
	//log errors
	wireless.on('error', function(error) {
		console.log("Wireless error :  "  + error);
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
		console.log("[  APPEAR] " + ssid + " [" + network.address + "] " + quality + "% " + network.strength + " dBm " + encryption_type);

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
		console.log("[  VANISH] " + ssid + " [" + network.address + "] " + quality + "% " + network.strength + " dBm " + encryption_type);
		for(var i = 0;i<networks.length;i++){
			if(networks[i].address === network.address){
				networks.splice(i,1);
			}
		}
	});
	
	callback(null,null);
}

function setupAP(callback){

kill_dnsmasq_and_hostapd(function(err,data){
		if(err){
			console.log(err);
		}else{
			console.log("hostapd and dnsmasq killed");
			ifconfig.down('wlan0', function(err) {
				if(err){
					console.log(err);
				}else{

					console.log("wlan0 successfully down");

					var ifup_options = {
					  interface: 'wlan0',
					  ipv4_address: options.AP_IP_ADDRESS,
					  ipv4_broadcast: options.BROADCAST,
					  ipv4_subnet_mask: '255.255.255.0'
					};

					ifconfig.up(ifup_options, function(err) {
						if(err){
							console.log(err);
						}else{
							console.log(ifup_options.interface + " is up on ip : " + options.AP_IP_ADDRESS);
		
							var dnsmasqoptions = {
							  interface: options.INTERFACE,
							  'listen-address':'172.24.1.1',
							  'bind-interfaces': '',
							  server: '8.8.8.8',
							  'domain-needed': '',
							  'dhcp-range': options.DHCP_RANGE
							};
	
							dnsmasq_enable(dnsmasqoptions, function(err){
								if(err){
									console.log(err);
								}else{
									console.log("dnsmasq file created");
									var hostapd_options = {
									  channel: 1,
									  driver: options.DRIVER,
									  interface: options.INTERFACE,
									  ssid: options.AP_SSID
									};



									hostapd.enable(hostapd_options, function(err) {
										if(err){
											console.log(err);
										}else{
											console.log("access point created on ssid " + hostapd_options.ssid);
										}
									});
								}
							});
	
						}
					});

				}

			});
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


function connectToWifi(ssid,passphrase,callback){

    wireless.disable(function() {
        console.log("[PROGRESS] Stopping and Exiting...");

        wireless.stop();
    });
	
	hostapd.disable(options.INTERFACE,function(err,data){
		if(err){
			console.log(err);
		}else{
			console.log(data);
		}
	});

	console.log(ssid);
	console.log(passphrase);
	
	var wpa_options = {
	  interface: 'wlan0',
	  ssid: ssid,
	  passphrase: passphrase,
	  driver: options.DRIVER
	};

	wpa_supplicant.enable(wpa_options, function(err) {
		if(err){
			console.log(err);
		}else{
			console.log("connected to " + ssid);
		    wireless.enable(function() {
		        console.log("[PROGRESS] starting");
		    });
		}
	});
	

	// kill_dnsmasq_and_hostapd(function(err,data){
	// 	if(err){
	// 		console.log(err);
	// 	}else{
	// 		var network;
	// 		var network_found = false;
	// 		for(var i = 0; i < networks.length ; i++){
	// 			if(ssid === networks[i].ssid){
	// 				network = networks[i];
	// 				network_found = true;
	// 			}
	//
	// 		}
	//
	// 		if(network_found){
	// 			console.log("network available");
	// 			        wireless.join(network, passphrase, function(err) {
	// 			            if (err) {
	// 			                console.log("[   ERROR] Unable to connect.");
	// 			                return;
	// 			            }
	//
	// 			            console.log("Yay, we connected! I will try to get an IP.");
	// 			            wireless.dhcp(function(ip_address) {
	// 			                console.log("Yay, I got an IP address (" + ip_address + ")");
	// 			            });
	// 			        });
	// 		}else{
	// 			console.log("network no longer available");
	// 		}
	// 	}
	// });
}


exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;