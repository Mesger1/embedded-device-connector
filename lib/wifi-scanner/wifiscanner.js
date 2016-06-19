var exec = require('child_process').exec;
var util = require('util');
var raspbian = require("./Raspbian.js");
var version;


function init(callback) {
	//exec lsb_release -a to detect version
	// OUTPUT :
	// No LSB modules are available.
	// Distributor ID:	Raspbian
	// Description:	Raspbian GNU/Linux 8.0 (jessie)
	// Release:	8.0
	// Codename:	jessie
    var new_env = util._extend(process.env, { LANG: "en" });
	var version_string = exec('lsb_release -a', new_env, function (err, stdout, stderr) {
        if (err) {
            callback(err, null);
            return;
        }
		version = stdout.match(/^Distributor ID:\t*([^\n\r]*)/)[1];
		console.log("Environment : " + version);
		
		//select appropriate version
		switch(version){
			case "Raspbian":
					raspbian.init(callback);
				break;
			default:
				callback(new Error("INIT : Environment not detected"),null);
				break;
		}
		
    });	 
}

function setupAP(callback){
	//select appropriate version
	switch(version){
		case "Raspbian":
				raspbian.setupAP(callback);
			break;
		default:
			callback(new Error("AP : Environment not detected"),null);
			break;
	}
}

function scanForWifi(callback) {
	//select appropriate version
	switch(version){
		case "Raspbian":
			raspbian.scanForWifi(callback);
			break;
		default:
			callback(new Error("SCAN : Environment not detected"),null);
			break;
	}
}

function connectToWifi(ssid,passphrase,callback){
	//select appropriate version
	switch(version){
		case "Raspbian":
			raspbian.connectToWifi(ssid,passphrase,callback);
			break;
		default:
			callback(new Error("CONNECT : Environment not detected"),null);
			break;
	}
}


exports.init = init;
exports.scanForWifi = scanForWifi;
exports.setupAP = setupAP;
exports.connectToWifi = connectToWifi;