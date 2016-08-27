// http://nodejs.org/api.html#_child_processes
var use_port = 3000;
var express = require('express'),
    app     = express(),
    port    = use_port;
var bodyParser = require('body-parser');
var https = require('http');
var wifiscanner = require('./wifi-scanner/wifiscanner.js');
var config = require('./network-config-util.js');
var options = require('./options.js');

logger = require('./logger.js');
var console = logger.logger;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var wifi = exports;

var serial;
var eth0;
var wlan0;

wifi.start = function(){
	
    app.use(express.static(__dirname + '/../public'))

    app.listen(use_port, function() {
        console.info('Wifi connector app listening on port : ' + use_port);
		wifiscanner.init(options,function handle_err(err,data){
			if(err){
				console.error(err);
			}
		});
		setInterval(function() { 
			wifiscanner.pingNetworks(function(err,data){
				console.info("serial : " + data.serial);
				serial = data.serial;
				console.info("wlan0 : " + data.wlan0);
				wlan0 = data.wlan0;
				console.info("eth0 : " + data.eth0);
				eth0 = data.eth0;
				
				
				var optionsget = {
					host : options.SERVER_URL,
					port : 3000,
					path : '/device/' + serial + '/wlan0/' + wlan0 + '/eth0/' + eth0 , // the rest of the url with parameters if needed
					method : 'GET' // do GET
				};
				// do the GET request
				var reqGet = https.request(optionsget, function(res) {
					console.log("statusCode: ", res.statusCode);
				});

				reqGet.end();
				reqGet.on('error', function(e) {
					console.error(e);
				});
				
			});
		},options.PING_TIMEOUT);
	});

    app.get('/wifi_list',function(req,res){
		var networks;
		wifiscanner.scanForWifi(function(err,data){
			networks=data;
		});
		res.json(networks);
		res.end();
    });

    app.get('/',function (req, res) {
      res.sendFile('/index.html');
      res.end();
    });


    app.post('/connect', function(req, res) {
		wifiscanner.connectToWifi(req.body['essid'],req.body['passphrase'],options,function handle_error(err,data){
			if(err){
				console.error(err);
				wifiscanner.setupAP(options,function handle_error(err,data){
					if(err){
						console.error(err);
					}
				});
			}
			setTimeout(function() { 
				config.findGateway(options,function handle_error(err,data){
					if(err){
						console.info("wifi not connected to : " + req.body['essid']);
						wifiscanner.setupAP(options,function handle_error(err,data){
							if(err){
								console.error(err);
							}
						});
					}else{
						console.info("wifi connected to : " + req.body['essid']);
						config.addHardcodedWPA(options,function handle_error(err,data){
							if(err){
								console.error(err);
							}
							config.removeWificonnectorOnBoot(function handle_error(err,data){
								if(err){
									console.error(err);
								}
							});
						});
					}
				});
			}, 30000);
		});
		res.redirect(options.SERVER_URL + '/?serial=' + serial);
	});
}
