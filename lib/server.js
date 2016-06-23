// http://nodejs.org/api.html#_child_processes
var use_port = 3000;
var express = require('express'),
    app     = express(),
    port    = use_port;
var bodyParser = require('body-parser');
var wifiscanner = require('./wifi-scanner/wifiscanner.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var wifi = exports;

wifiscanner.init();
wifiscanner.setupAP(function(err,data){
	if(err){
		console.log("[  SERVER] " + err);
		return;
	}
	console.log("[  SERVER] " + data);
});


wifi.start = function(){

	
    app.use(express.static(__dirname + '/../public'))

    app.listen(use_port, function() {
            console.log('[    INIT] Wifi connector app listening on port : ' + use_port);
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
				console.log(err);
			}else{
				console.log(data);
			}
			
		});
		res.end();
    });
}
