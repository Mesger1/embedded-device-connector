var exec = require('child_process').exec;
var util = require('util');
var fs = require("fs");
var Wireless = require('wireless');
var hostapd = require('wireless-tools/hostapd');
var ifconfig = require('wireless-tools/ifconfig');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');
var networks = [];
var wireless;


logger = require('../logger.js');
var console = logger.logger;

var options_cpy;

function wpa_enable(options, callback) {
  var file = options_cpy.TMP_DIR + "/" +  options.interface + '-wpa_supplicant.conf';

  var command = 'wpa_passphrase "' + options.ssid + '" "' + options.passphrase
    + '" > ' + file + ' && wpa_supplicant -i ' + options.interface + ' -B -D '
    + options.driver + ' -c ' + file

  return exec(command, callback);  
}

function dnsmasq_enable(options, callback) {
  var file = options_cpy.TMP_DIR + "/" +  options.interface + '-dnsmasq.conf';

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
  var file = options_cpy.TMP_DIR + "/" + options.interface + '-dhcpcd.conf';

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
					console.error(err);
					callback(err,null);
					return;
				}
			});
		}
		isRunning("dnsmasq",function(err,data){
			if(data == 1 ){					
				exec("sudo pkill dnsmasq",function(err,data){
					if(err){
						console.error(err);
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
			console.error(err);
			callback(err,null);
			return;
		}
		exec("/etc/init.d/dnsmasq restart",function(err,data){
			if(err){
				console.error(err);
				callback(err,null);
				return;
			}
			callback(null,data);		
		});
	});
}

function init(options) {
	options_cpy = options;
	
	wireless = new Wireless({
	    iface: options_cpy.INTERFACE,
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

function removeHardcodedWPA(callback){
	var source_file_path = '/etc/network/interfaces';

	fs.readFile(source_file_path, 'utf8', function (rfErr, rfData) {
		if (rfErr) {
			console.error("Could not read /etc/network/interfaces");
			callback(new Error("Could not read /etc/network/interfaces",null));
			return;
		}
		var fileData = rfData.toString();
		fileData = fileData.replace('   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf', '#   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf');
		fs.writeFile(source_file_path, fileData, 'utf8', function (wfErr) {
			if (wfErr) {
				console.error("Could not write /etc/network/interfaces");
				callback(new Error("Could not write /etc/network/interfaces",null));
				return;
			}
			callback(null,"Removed Hardcoded WPA");
		});
	});
}

function isRunning(name,callback){
	exec("ps -cax | grep " + name,function(err,data,stderr){
		if(err){
			console.debug(name + " not running");
			callback(err,0);
		}else{
			if(data){
				console.debug(name + " running");
				callback(null,1);
			}else{
				console.debug(name + " not running");
				callback(null,0);
			}
		}
	})
}



function setupAP(callback){
	
	var dnsmasqoptions = {
	  interface: options_cpy.INTERFACE,
	  'listen-address':options_cpy.AP_IP_ADDRESS,
	  'bind-interfaces': '',
	  server: '8.8.8.8',
	  'domain-needed': '',
	  'dhcp-range': options_cpy.DHCP_RANGE
	};
	
	var hostapd_options = {
	  channel: 6,
	  driver: options_cpy.DRIVER,
	  interface: options_cpy.INTERFACE,
	  ssid: options_cpy.AP_SSID
	};
	wireless.stop();
	
	removeHardcodedWPA(function(err,data){
		if(err){
			console.error(err);
			callback(err,null);
			return 0;
		}
		console.debug("hardcoded wpa removed");
		isRunning("wpa",function(err,data){
			if(data == 1 ){
				exec("sudo pkill wpa",function(err,data){
					if(err){
						console.error(err);
						callback(err,null);
						return 0;
					}
					console.debug("wpa_supplicant killed");
				});
			}
			exec("sudo systemctl daemon-reload",function(err,data){
				if(err){
					console.error(err);
					callback(err,null);
					return 0;
				}
				console.debug("daemon reloaded");
				
				exec("sudo service dhcpcd restart",function(err,data){
					if(err){
						console.error(err);
						callback(err,null);
						return 0;
					}
					console.debug("dhcpcd restarted");
				
					down(options_cpy.INTERFACE,'0.0.0.0',function(err,data){						
						if(err){
							console.error(err);
							callback(err,null);
							return 0;
						}
						console.debug("ifconfig down 0.0.0.0");
						
						up(options_cpy.INTERFACE,'0.0.0.0',function(err,data){
							if(err){
								console.error(err);
								callback(err,null);
								return 0;
							}
							console.debug("ifconfig up 0.0.0.0");
				
							kill_dnsmasq_and_hostapd(function(err,data){
								if(err){
									console.error(err);
									callback(err,null);
									return 0;
								}
								console.debug("dnsmasq and hostapd killed");
				
								down(options_cpy.INTERFACE,options_cpy.AP_IP_ADDRESS,function(err,data){
									if(err){
										console.error(err);
										callback(err,null);
										return 0;
									}
									console.debug("ifconfig down " + options_cpy.INTERFACE);
				
									up(options_cpy.INTERFACE,options_cpy.AP_IP_ADDRESS,function(err,data){
										if(err){
											console.error(err);
											callback(err,null);
											return 0;
										}
										console.debug("ifconfig up " + options_cpy.INTERFACE);
				
										dnsmasq_enable(dnsmasqoptions,function(err,data){
											if(err){
												console.error(err);
												callback(err,null);
												return 0;
											}
											console.debug("dnsmasq options set");
				
											hostapd.enable(hostapd_options,function(err,data){
												if(err){
													console.error(err);
													callback(err,null);
													return 0;
												}
											});
											console.debug("hostapd enabled");				
											callback(null,"AP Successfully set to " + options_cpy.AP_IP_ADDRESS);		
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
	  interface: options_cpy.INTERFACE,
	  ssid: ssid,
	  passphrase: passphrase,
	  driver: options_cpy.DRIVER
	};

	kill_dnsmasq_and_hostapd(function(err,data){
		if(err){
			console.error(err);
			callback(err,null);
			return 0;
		}
		console.debug("hostapd and dnsmasq killed");
		
		isRunning("wpa",function(err,data){
			if(data == 1 ){
				exec("sudo pkill wpa",function(err,data){
					if(err){
						console.error(err);
						callback(err,null);
						return 0;
					}
					console.debug("wpa_supplicant killed");
				});
			}
		
			exec("sudo systemctl daemon-reload",function(err,data){
				if(err){
					console.error(err);
					callback(err,null);
					return 0;
				}
				console.debug("daemon reloaded");
			
				exec("sudo service dhcpcd restart",function(err,data){
					if(err){
						console.error(err);
						callback(err,null);
						return 0;
					}
					console.debug("dhcpcd restarted");
				
					down(options_cpy.INTERFACE,'0.0.0.0',function(err,data){						
						if(err){
							console.error(err);
							callback(err,null);
							return 0;
						}
						console.debug("ifconfig down 0.0.0.0");
					
						up(options_cpy.INTERFACE,'0.0.0.0',function(err,data){
							if(err){
								console.error(err);
								callback(err,null);
								return 0;
							}
							console.debug("ifconfig up 0.0.0.0");
							wpa_enable(wpa_options,function(err,data){
								if(err){
									console.error(err);
									callback(err,null);
									return 0;
								}
								console.debug("wpa up on interface : " + wpa_options.interface);
								console.debug("wpa up on ssid : " + wpa_options.ssid);
								console.debug("wpa up with driver : " + wpa_options.driver);
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