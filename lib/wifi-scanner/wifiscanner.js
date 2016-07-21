var logger = require('../logger.js');
var sync = require('synchronize');
var console = logger.logger;
var fs = require("fs");
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var util = require('util');
var raspbian = require("./raspbian.js");
var dns = require('dns');
var options = require('../options.js');

var version;

sync(raspbian,'init','setupAP','scanForWifi','connectToWifi');

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
					sync.fiber(raspbian.init);
					sync.fiber(setupAP);
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
			sync.fiber(raspbian.setupAP);
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

function connectToWifi(ssid,passphrase){
	//select appropriate version
	switch(version){
		case "Raspbian":
			console.info("Connecting to ssid : " + ssid);
			return sync.fiber(function(){
					raspbian.connectToWifi(ssid,passphrase);
			});
			break;
		default:
			console.error("Environment not detected while connecting to wifi");
			break;
	}
	return false;
}

function checkInternet(){
	dns.resolve('www.google.com', function(err,data) {
		if (err == null) {
			console.debug("google found");
			return true;
		}
	});
	console.debug("google not found");
	return false;
}

function findGateway(){
	exec("ip route show default | grep " + options.INTERFACE  + " | awk '/default/ {print $3}'",function(err,data,stderr){
		if(data){
			console.debug("gateway found");
			return true;
		}
	});
	console.debug("gateway not found");
	return false;
}

function addHardcodedWPA(){
	var source_file_path = '/etc/network/interfaces';

	fs.readFile(source_file_path, 'utf8', function (rfErr, rfData) {
		if (rfErr) {
			console.error("Could not read /etc/network/interfaces");
			callback(new Error("Could not read /etc/network/interfaces",null));
			return;
		}
		var fileData = rfData.toString();
		fileData = fileData.replace('#   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf', '   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf');
		fs.writeFile(source_file_path, fileData, 'utf8', function (wfErr) {
			if (wfErr) {
				console.error("Could not write /etc/network/interfaces");
				callback(new Error("Could not write /etc/network/interfaces",null));
				return;
			}
			exec("sudo mv " + options.TMP_DIR + "/" + options.INTERFACE + "-wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf",function(err,data){
					if(err){
						console.error("Could not copy conf to /etc/wpa_supplicant/wpa_supplicant");
						callback(new Error("Could not copy conf to /etc/wpa_supplicant/wpa_supplicant",null));
						return;						
					}
					callback(null,"Added Hardcoded WPA");
			});
		});
	});
	
}

function removeWificonnectorOnBoot(callback){
	var source_file_path = '/etc/rc.local';
	fs.readFile(source_file_path, 'utf8', function (rfErr, rfData) {
		if (rfErr) {
			console.error("Could not read /etc/rc.local");
			callback(new Error("Could not read /etc/rc.local",null));
			return;
		}
		var fileData = rfData.toString();
		fileData = fileData.replace('sudo wifi-connector', '');
		fs.writeFile(source_file_path, fileData, 'utf8', function (wfErr) {
			if (wfErr) {
				console.error("Could not write /etc/rc.local");
				callback(new Error("Could not write /etc/rc.local",null));
				return;
			}
			callback(null,"Removed wifi-connector on boot");
		});
	});
}

exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;
exports.checkInternet = checkInternet;
exports.findGateway = findGateway;
exports.addHardcodedWPA = addHardcodedWPA;
exports.removeWificonnectorOnBoot = removeWificonnectorOnBoot;
