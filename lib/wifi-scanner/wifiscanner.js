var fs = require("fs");
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var util = require('util');
var raspbian = require("./raspbian.js");
var version;




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
				raspbian.init();
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

exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;