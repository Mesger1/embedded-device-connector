var exec = require('child_process').exec;
var util = require('util');
var Wireless = require('wireless');
var hostapd = require('wireless-tools/hostapd');
var ifconfig = require('wireless-tools/ifconfig');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');
var networks = [];
var wireless;


var options;

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


function dhcpcd_enable(options, callback) {
  var file = options.interface + '-dhcpcd.conf';

  var commands = [ 
    'cat <<EOF >' + file + ' && dhcpcd --config ' + file
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



function down(interface, ip, callback) {
  exec('ifconfig ' + interface + ' ' + ip + ' down', callback);
}

function up(interface, ip, callback) {
  exec('ifconfig ' + interface + ' ' + ip + ' up', callback);
}

function kill_dnsmasq_and_hostapd(callback){
	isRunning("hostapd",function(err,data){
		if(data == 1 ){	
			exec("sudo pkill hostapd",function(err,data){
				if(err){
					console.log("[   ERROR] " + err);
					callback(err,null);
					return;
				}
			});
		}
		isRunning("dnsmasq",function(err,data){
			if(data == 1 ){					
				exec("sudo pkill dnsmasq",function(err,data){
					if(err){
						console.log("[   ERROR] " + err);
						callback(err,null);
						return;
					}
				});
			}
			callback(null,data);
		});	
	});
}

function restart_dnsmasq_and_hostapd(callback){
	exec("/etc/init.d/hostapd restart",function(err,data){
		if(err){
			console.log("[   ERROR] " + err);
			callback(err,null);
			return;
		}
		exec("/etc/init.d/dnsmasq restart",function(err,data){
			if(err){
				console.log("[   ERROR] " + err);
				callback(err,null);
				return;
			}
			callback(null,data);		
		});
	});
}

function init(options_copy) {
	options = options_copy;
	
	wireless = new Wireless({
	    iface: options.INTERFACE,
		updateFrequency: 10, // Optional, seconds to scan for networks
		connectionSpyFrequency: 10, // Optional, seconds to scan if connected
		vanishThreshold: 10 // Optional, how many scans before network considered gone
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
}

function isRunning(name,callback){
	exec("ps -cax | grep " + name,function(err,data,stderr){
		if(err){
			console.log("[  SYSTEM] " + name + " not running");
			callback(err,0);
		}else{
			if(data){
				console.log("[  SYSTEM] " + name + " running");
				callback(null,1);
			}else{
				console.log("[  SYSTEM] " + name + " not running");
				callback(null,0);
			}
		}
	})
}

function setupAP(callback){
	
	var dnsmasqoptions = {
	  interface: options.INTERFACE,
	  'listen-address':options.AP_IP_ADDRESS,
	  'bind-interfaces': '',
	  server: '8.8.8.8',
	  'domain-needed': '',
	  'dhcp-range': options.DHCP_RANGE
	};
	
	var hostapd_options = {
	  channel: 6,
	  driver: options.DRIVER,
	  interface: options.INTERFACE,
	  ssid: options.AP_SSID
	};
	wireless.stop();
		
	isRunning("wpa",function(err,data){
		if(data == 1 ){
			exec("sudo pkill wpa",function(err,data){
				if(err){
					console.log("[   ERROR] " + err);
					callback(err,null);
					return 0;
				}
				console.log("[  SYSTEM] wpa_supplicant killed");
			});
		}
		exec("sudo systemctl daemon-reload",function(err,data){
			if(err){
				console.log("[   ERROR] " + err);
				callback(err,null);
				return 0;
			}
			console.log("[  SYSTEM] daemon reloaded");
			
			exec("sudo service dhcpcd restart",function(err,data){
				if(err){
					console.log("[   ERROR] " + err);
					callback(err,null);
					return 0;
				}
				console.log("[  SYSTEM] dhcpcd restarted");
			
				down(options.INTERFACE,'0.0.0.0',function(err,data){						
					if(err){
						console.log("[   ERROR] " + err);
						callback(err,null);
						return 0;
					}
					console.log("[  SYSTEM] ifconfig down 0.0.0.0");
					
					up(options.INTERFACE,'0.0.0.0',function(err,data){
						if(err){
							console.log("[   ERROR] " + err);
							callback(err,null);
							return 0;
						}
						console.log("[  SYSTEM] ifconfig up 0.0.0.0");
			
						kill_dnsmasq_and_hostapd(function(err,data){
							if(err){
								console.log("[   ERROR] " + err);
								callback(err,null);
								return 0;
							}
							console.log("[  SYSTEM] dnsmasq and hostapd killed");
			
							down(options.INTERFACE,options.AP_IP_ADDRESS,function(err,data){
								if(err){
									console.log("[   ERROR] " + err);
									callback(err,null);
									return 0;
								}
								console.log("[  SYSTEM] ifconfig down " + options.INTERFACE);
			
								up(options.INTERFACE,options.AP_IP_ADDRESS,function(err,data){
									if(err){
										console.log("[   ERROR] " + err);
										callback(err,null);
										return 0;
									}
									console.log("[  SYSTEM] ifconfig up " + options.INTERFACE);
			
									dnsmasq_enable(dnsmasqoptions,function(err,data){
										if(err){
											console.log("[   ERROR] " + err);
											callback(err,null);
											return 0;
										}
										console.log("[  SYSTEM] dnsmasq options set");
			
										hostapd.enable(hostapd_options,function(err,data){
											if(err){
												console.log("[   ERROR] " + err);
												callback(err,null);
												return 0;
											}
										});
										console.log("[  SYSTEM] hostapd enabled");				
										callback(null,"AP Successfully set to " + options.AP_IP_ADDRESS);		
										return 1;
									});
								
								});
							});
						});				
					});
				});
			});
		});		
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
	var wpa_options = {
	  interface: options.INTERFACE,
	  ssid: ssid,
	  passphrase: passphrase,
	  driver: options.DRIVER
	};

	kill_dnsmasq_and_hostapd(function(err,data){
		if(err){
			console.log("[   ERROR] " + err);
			callback(err,null);
			return 0;
		}
		console.log("[  SYSTEM] hostapd and dnsmasq killed");
		
		isRunning("wpa",function(err,data){
			if(data == 1 ){
				exec("sudo pkill wpa",function(err,data){
					if(err){
						console.log("[   ERROR] " + err);
						callback(err,null);
						return 0;
					}
					console.log("[  SYSTEM] wpa_supplicant killed");
				});
			}
		
			exec("sudo systemctl daemon-reload",function(err,data){
				if(err){
					console.log("[   ERROR] " + err);
					callback(err,null);
					return 0;
				}
				console.log("[  SYSTEM] daemon reloaded");
			
				exec("sudo service dhcpcd restart",function(err,data){
					if(err){
						console.log("[   ERROR] " + err);
						callback(err,null);
						return 0;
					}
					console.log("[  SYSTEM] dhcpcd restarted");
				
					down(options.INTERFACE,'0.0.0.0',function(err,data){						
						if(err){
							console.log("[   ERROR] " + err);
							callback(err,null);
							return 0;
						}
						console.log("[  SYSTEM] ifconfig down 0.0.0.0");
					
						up(options.INTERFACE,'0.0.0.0',function(err,data){
							if(err){
								console.log("[   ERROR] " + err);
								callback(err,null);
								return 0;
							}
							console.log("[  SYSTEM] ifconfig up 0.0.0.0");
							wpa_supplicant.enable(wpa_options,function(err,data){
								if(err){
									console.log("[   ERROR] " + err);
									callback(err,null);
									return 0;
								}
								console.log("[  SYSTEM] wpa up on interface : " + wpa_options.interface);
								console.log("[  SYSTEM] wpa up on ssid : " + wpa_options.ssid);
								console.log("[  SYSTEM] wpa up with driver : " + wpa_options.driver);
								callback(null,"wifi configurations being tested")
							});
						});
					});
				
				});
			});
		});
	});
	
}




exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;