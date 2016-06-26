// http://nodejs.org/api.html#_child_processes
var use_port = 3000;
var express = require('express'),
    app     = express(),
    port    = use_port;
var bodyParser = require('body-parser');
var wifiscanner = require('./wifi-scanner/wifiscanner.js');

logger = require('./logger.js');
var console = logger.logger;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var wifi = exports;

wifiscanner.init(function(err,data){
	if(err){
		console.error(err);
		return;
	}
	wifiscanner.setupAP(function(err,data){
		if(err){
			console.error(err);
			return;
		}
		console.info(data);
	});
});

wifi.start = function(){

	
    app.use(express.static(__dirname + '/../public'))

    app.listen(use_port, function() {
            console.info('Wifi connector app listening on port : ' + use_port);
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
		wifiscanner.connectToWifi(req.body['essid'],req.body['passphrase'],function(err,data){
			if(err){
				console.error(err);
				wifiscanner.setupAP(function(err,data){
					if(err){
						console.error(err);
						return;
					}
					console.info(data);
				});
				return;
			}else{
				console.info(data);
				setTimeout(function() { 
					wifiscanner.findGateway(function(err,data){
						if(err){
							wifiscanner.setupAP(function(err,data){
								if(err){
									console.error(err);
									return;
								}
								console.info(data);
							});
						}else{
							wifiscanner.addHardcodedWPA(function(err,data){
								if(err){
									console.error(err);
									return;
								}
								console.info("wpa configuration file set");
								wifiscanner.removeWificonnectorOnBoot(function(err,data){
									if(err){
										console.error(err);
										return;
									}
									console.info("automatic wificonnector boot disabled");										
								});
							});
							
						}
								
					});
				}, 15000);
			}			
		});
	res.redirect('/?essid=' + req.body['essid']);
		
    });
}
