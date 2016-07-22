// http://nodejs.org/api.html#_child_processes
var use_port = 3000;
var express = require('express'),
    app     = express(),
    port    = use_port;
var bodyParser = require('body-parser');
var wifiscanner = require('./wifi-scanner/wifiscanner.js');

logger = require('./logger.js');
var console = logger.logger;
var sync = require('synchronize');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var wifi = exports;

wifi.start = function(){
	
	
	
    app.use(express.static(__dirname + '/../public'))

    app.listen(use_port, function() {
        console.info('Wifi connector app listening on port : ' + use_port);
		sync.fiber(wifiscanner.init);
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
		sync.fiber(function(){
			if(wifiscanner.connectToWifi(req.body['essid'],req.body['passphrase'])){
				setTimeout(function() { 
						if(wifiscanner.findGateway()){
							console.info("wifi connected to : " + req.body['essid']);
							sync.fiber(wifiscanner.addHardcodedWPA);
							sync.fiber(wifiscanner.removeWificonnectorOnBoot);
						}else{
							console.info("wifi not connected to : " + req.body['essid']);
							sync.fiber(wifiscanner.setupAP);
						}
				}, 20000);
			}else{
				sync.fiber(wifiscanner.setupAP);
			}	
			res.redirect('/?essid=' + req.body['essid']);
		});
    });
	
}
