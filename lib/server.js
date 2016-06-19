// http://nodejs.org/api.html#_child_processes
var use_port = 3000;
var fs = require('fs');
var path = require('path');
var wifi = require('./wifi-scanner/wifi-scanner.js');
var express = require('express'),
    app     = express(),
    port    = use_port;

var wifi = exports;

var Wireless = require('wireless');

var exec = require('child_process').exec;

var bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var connected = false;
var iface = process.argv[2];
// The SSID of an open wireless network you'd like to connect to
var SSID = 'xfinitywifi';
var networks = [];
//  Try scanning for access points:
var wireless = new Wireless({
    iface: 'wlan0',
	updateFrequency: 2, // Optional, seconds to scan for networks
	connectionSpyFrequency: 2, // Optional, seconds to scan if connected
	vanishThreshold: 2 // Optional, how many scans before network considered gone
});

wireless.enable(function(err) {
	if(err) { console.log(err); }
	wireless.start();
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

wifi.start = function(){
   app.use(express.static(__dirname + '/../public'))
        
		
    var apn_command = exec("sudo "  + __dirname + "/../setup_wifi_apn.sh", function (error, stdout, stderr) {
        if(error){
            console.log(stderr);
        }
    });
        apn_command.stdout.on('data', function (data) {
        process.stdout.write(data);
    });



    app.get('/wifi_list',function(req,res){
		res.json(networks);
		res.end();
    });


    app.get('/',function (req, res) {
      res.sendFile('/index.html');
      res.end();
    });

    app.listen(use_port, function() {
            console.log('wifi connector app listening');
    });

    app.post('/connect', function(req, res) {
            console.log((essid = req.body['essid']));
            console.log((passphrase = req.body['passphrase']));
		    var _ap = {
		      ssid: essid,
		      password: passphrase
		    };
		    var results = WiFiControl.connectToAP( _ap, function(err, response) {
		      if (err) console.log(err);
		      console.log(response);
		    });
            res.end();
    });
}
