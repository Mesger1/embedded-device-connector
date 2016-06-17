// http://nodejs.org/api.html#_child_processes
var use_port = 3000;
var fs = require('fs');
var path = require('path');
var wifi = require('./wifi-scanner/wifi-scanner.js');
var express = require('express'),
    app     = express(),
    port    = use_port;

var wifi = exports;

var exec = require('child_process').exec;

var bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var WiFiControl = require('wifi-control');


wifi.start = function(){
   app.use(express.static(__dirname + '/../public'))
        
    //  Initialize wifi-control package with verbose output
    WiFiControl.init({
      debug: true
    });
		
    var apn_command = exec("sudo "  + __dirname + "/../setup_wifi_apn.sh", function (error, stdout, stderr) {
        if(error){
            console.log(stderr);
        }
    });
        apn_command.stdout.on('data', function (data) {
        process.stdout.write(data);
    });



    app.get('/wifi_list',function(req,res){

	    //  Try scanning for access points:
	    WiFiControl.scanForWiFi( function(err, data) {
            if(err){
                console.log("wifiscanner : " + err);
                return
            }
			console.log(data);
            console.log("wifiscanner : start of list");
            for(i=0;i<data.length;i++){
                console.log("wifiscanner : " + data.networks[i].ssid);
            }
            console.log("wifiscanner : end of list");
            res.json(data.networks);
            res.end();
	    });

     
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
