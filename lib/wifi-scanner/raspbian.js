var logger = require('../logger.js');
var config = require('../network-config-util.js');
var wifis = require('../wireless-wifi-finder.js');

var console = logger.logger;


function init(options){
	options.AP_SSID = "Pi3-AP";
	options.PASSPHRASE = "raspberry";
}

function setupAP(options,callback){
	config.backup_and_set_dhcpcd_conf(options,true,function handle_error(err,data){
		if(err){
			callback(err,null);
			return 0;
		}
		console.debug("dhcpcd handling done");
		config.backup_and_set_network_interfaces(options,false,function handle_error(err,data){
			if(err){
				callback(err,null);
				return 0;
			}
			console.debug("network interfaces handling done");
			config.backup_and_set_dnsmasq_conf(options,function handle_error(err,data){
				if(err){
					callback(err,null);
					return 0;
				}
				console.debug("dnsmasq options set");				
				config.backup_and_set_hostapd_conf(options,function handle_error(err,data){
					if(err){
						callback(err,null);
						return 0;
					}
					console.debug("hostapd options set");		
					config.exec("sudo pkill wpa",function handle_error(err,data){
						// do not handle error here
						console.debug("wpa processes nonexistant");
						config.exec("/bin/systemctl daemon-reload",function handle_error(err,data){
							if(err){
								callback(err,null);
								return 0;
							}
							console.debug("daemon reloaded");
							config.exec("/usr/sbin/service dhcpcd restart",function handle_error(err,data){
								if(err){
									callback(err,null);
									return 0;
								}
								console.debug("dhcpcd restarted");
								config.down(options,'0.0.0.0',function handle_error(err,data){
									if(err){
										callback(err,null);
										return 0;
									}
									console.debug("ifconfig down 0.0.0.0");
									config.up(options,'0.0.0.0',function handle_error(err,data){
										if(err){
											callback(err,null);
											return 0;
										}
										console.debug("ifconfig up 0.0.0.0");
										config.kill_dnsmasq_and_hostapd(function handle_error(err,data){
											if(err){
												callback(err,null);
												return 0;
											}
											console.debug("dnsmasq and hostapd killed");
											config.down(options,options.AP_IP_ADDRESS,function handle_error(err,data){
												if(err){
													callback(err,null);
													return 0;
												}
												console.debug("ifconfig down " + options.INTERFACE);
												config.up(options,options.AP_IP_ADDRESS,function handle_error(err,data){
													if(err){
														callback(err,null);
														return 0;
													}
													console.debug("ifconfig up " + options.INTERFACE);
													config.restart_dnsmasq_and_hostapd(function handle_error(err,data){
														if(err){
															callback(err,null);
															return 0;
														}
														console.debug("hostapd and dnsmasq restarted");
														config.checkRunningAndKill("hostapd",function handle_error(err,data){
															if(err){
																callback(err,null);
																return 0;
															}
															console.debug("hostapd processes non existant");
															config.exec("/usr/sbin/hostapd /etc/hostapd/hostapd.conf &");
															console.debug("hostapd started");
															callback(null,'done')
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
				});
			});
		});
	});
}

function scanForWifi(callback) {
	if(wifis.networks == null){
		callback(new Error("network container not inititalized"),null);
	}else{
		callback(null,wifis.networks);
	}
}


function connectToWifi(ssid,passphrase,options,callback){
	config.backup_and_set_dhcpcd_conf(options,false,function handle_error(err,data){
	if(err){
		callback(err,null);
	}
		config.kill_dnsmasq_and_hostapd(function handle_error(err,data){
		if(err){
			callback(err,null);
		}
			console.debug("hostapd and dnsmasq killed");
			config.exec("systemctl daemon-reload",function handle_error(err,data){
			if(err){
				callback(err,null);
			}
				config.exec("sudo pkill wpa",function handle_error(err,data){
				// todo why crashing if no wpa process running
				// if(err){
					// callback(err,null);
				// }
					console.debug("daemon reloaded");
					config.exec("service dhcpcd restart",function handle_error(err,data){
					if(err){
						callback(err,null);
					}
						console.debug("dhcpcd restarted");
						config.down(options,'0.0.0.0',function handle_error(err,data){
						if(err){
							callback(err,null);
						}
							console.debug("ifconfig down 0.0.0.0");
							config.up(options,'0.0.0.0',function handle_error(err,data){
							if(err){
								callback(err,null);
							}
								console.debug("ifconfig up 0.0.0.0");
								config.wpa_config(ssid,passphrase,options,function handle_error(err,data){
								if(err){
									callback(err,null);
								}
									console.info("wpa being tested");
									config.exec("ifdown wlan0",function handle_error(err,data){
									if(err){
										callback(err,null);
									}
										config.exec("ifup wlan0",function handle_error(err,data){
										if(err){
											callback(err,null);
										}
											config.exec("pkill dnsmasq",function handle_error(err,data){
												console.debug("dnsmasq killed");
												callback(null,'done');
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
	});  
}

exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;