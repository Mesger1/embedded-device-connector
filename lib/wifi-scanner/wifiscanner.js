var logger = require('../logger.js');
var console = logger.logger;
var fs = require("fs");
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var util = require('util');
var raspbian = require("./raspbian.js");
var dns = require('dns');
var options = require('../options.js');

var version;

var wifis = require('../wireless-wifi-finder.js');


function init() {
	//exec lsb_release -a to detect version
	// OUTPUT :
	// No LSB modules are available.
	// Distributor ID:	Raspbian
	// Description:	Raspbian GNU/Linux 8.0 (jessie)
	// Release:	8.0
	// Codename:	jessie
	fs.exists(options.TMP_DIR,function(exists){
		if(exists){
			console.info("tmp dir was already created");
		}else{
			exec("mkdir " + options.TMP_DIR,function(err,data){
				if(err){
					console.error(err);
				}
				console.info("created tmp dir");
			}); 
		}
		execSync('lsb_release -a | tee ' + options.TMP_DIR + '/lsb_release.txt');
		var output = fs.readFileSync(options.TMP_DIR + '/lsb_release.txt');
		version = output.toString().match(/Distributor ID:\t*([^\n\r]*)/)[1];
			//select appropriate version
			console.debug("Parsed : " + version);
			switch(version){
				case "Raspbian":			
					console.info("Found Raspbian");
					wifis.start_wireless_finder();
					setupAP(function handle_error(err,data){
						if(err){
							console.error(err);
						}
					});
					break;
				default:
					console.error("Environment not detected");
					break;
			}
	});
}



function setupAP(){
	//select appropriate version
	switch(version){
		case "Raspbian":
			console.info("Installing AP")
			raspbian.setupAP(function handle_error(err,data){
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

function connectToWifi(ssid,passphrase,callback){
	//select appropriate version
	switch(version){
		case "Raspbian":
			console.info("Connecting to ssid : " + ssid);
			raspbian.connectToWifi(ssid,passphrase,function handle_error(err,data){
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

