var fs = require("fs");
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var util = require('util');
var raspbian = require("./raspbian.js");
var dns = require('dns');
var version;
var winston = require('winston');

var console  = new (winston.transports.File)({    
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: './wificonnector.log' })
    ]
});

var options = {
	INTERFACE: 'wlan0',
	AP_IP_ADDRESS: '192.168.3.1',
	DHCP_RANGE: '192.168.3.50,192.168.3.150,12h',
	BROADCAST: '192.168.3.255',
	DRIVER: 'nl80211',
	AP_SSID: 'Pi3-AP'
}


function init() {
	//exec lsb_release -a to detect version
	// OUTPUT :
	// No LSB modules are available.
	// Distributor ID:	Raspbian
	// Description:	Raspbian GNU/Linux 8.0 (jessie)
	// Release:	8.0
	// Codename:	jessie
    execSync('lsb_release -a | tee ./lsb_release.txt');
	var output = fs.readFileSync('./lsb_release.txt');
	version = output.toString().match(/Distributor ID:\t*([^\n\r]*)/)[1];
		//select appropriate version
		switch(version){
			case "Raspbian":
				raspbian.init(options);
				console.log("[    INIT] Found Raspbian");
				break;
			default:
				console.log("[    INIT] Environment not detected");
				break;
		}
}

function setupAP(callback){
	//select appropriate version
	switch(version){
		case "Raspbian":
			raspbian.setupAP(callback);
			console.log("[   SETUP] installing AP")
			break;
		default:
			console.log("[   SETUP] Environment not detected during AP installation");
			break;
	}
}

function scanForWifi(callback) {
	//select appropriate version
	switch(version){
		case "Raspbian":
			console.log("[    SCAN] getting wifi container values");
			raspbian.scanForWifi(callback);
			break;
		default:
			console.log("[    SCAN] Environment not detected during wifiscan");
			break;
	}
}

function connectToWifi(ssid,passphrase,callback){
	//select appropriate version
	switch(version){
		case "Raspbian":
			console.log("[ CONNECT] connecting to ssid : " + ssid);
			raspbian.connectToWifi(ssid,passphrase,callback);
			break;
		default:
			console.log("[ CONNECT] Environment not detected while connecting to wifi");
			break;
	}
}

function checkInternet(callback){
	dns.resolve('www.google.com', function(err,data) {
	  if (err) {
		  callback(new Error("no internet connection"),null);
	  } else {
		  callback(null,"[ CONNECT] connected to internet");
	  }
	  return;
	});
}

function findGateway(callback){
	exec("ip route show default | grep " + options.INTERFACE  + " | awk '/default/ {print $3}'",function(err,data,stderr){
		if(data){
			callback(null,data)
		}else{
			callback(new Error("Fault parsing gateway"),null);
		}
	});
}

function addHardcodedWPA(callback){
	var source_file_path = '/etc/network/interfaces';

	fs.readFile(source_file_path, 'utf8', function (rfErr, rfData) {
		if (rfErr) {
			console.log("[   ERROR] Could not read /etc/network/interfaces");
			callback(new Error("Could not read /etc/network/interfaces",null));
			return;
		}
		var fileData = rfData.toString();
		fileData = fileData.replace('#   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf', '   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf');
		fs.writeFile(source_file_path, fileData, 'utf8', function (wfErr) {
			if (wfErr) {
				console.log("[   ERROR] Could not write /etc/network/interfaces");
				callback(new Error("Could not write /etc/network/interfaces",null));
				return;
			}
			exec("sudo mv ./" + options.INTERFACE + "-wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf",function(err,data){
					if(err){
						console.log("[   ERROR] Could not copy conf to /etc/wpa_supplicant/wpa_supplicant");
						callback(new Error("Could not copy conf to /etc/wpa_supplicant/wpa_supplicant",null));
						return;						
					}
					callback(null,"[  SYSTEM] added Hardcoded WPA");
			});
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