// http://nodejs.org/api.html#_child_processes
var use_port = 80;
var express = require('express'),
    app     = express(),
    port    = use_port;
var bodyParser = require('body-parser');
var http = require('http');
var wifiscanner = require('./wifi-scanner/wifiscanner.js');
var config = require('./network-config-util.js');
var options = require('./options.js');
var events = require('events');
logger = require('./logger.js');
var console = logger.logger;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var wifi = exports;

var serial;
var gateway_eth0;
var gateway_wlan0;
var ip_eth0;
var ip_wlan0;
var type; 
var ssid; 
var passphrase;

var isAp = false;
var isConnected = false;
 
var eventEmitter = new events.EventEmitter();
var isBusy = false;

wifi.start = function(){
	
	setInterval(function(){
		wifiscanner.pingNetworks(function(err,data){
			console.info("serial : " + data.serial);
			serial = data.serial;
			console.info("gateway-wlan0 : " + data.gatewaywlan0);
			gateway_wlan0 = data.gatewaywlan0;
			console.info("gateway-eth0 : " + data.gatewayeth0);
			gateway_eth0 = data.gatewayeth0;
			console.info("ip-wlan0 : " + data.ipwlan0);
			ip_wlan0 = data.ipwlan0;
			console.info("ip-eth0 : " + data.ipeth0);
			ip_eth0 = data.ipeth0;
			console.info("type : " + data.type);
			type = data.type;
		});
		
		config.findGateway(options,function(err,data){
			if(err){
				isConnected = false;
			}else{
				isConnected = true;
				eventEmitter.emit('connected');
			}
		});
	},options.PING_TIMEOUT);
	
	setInterval(function(){
		if(!isBusy){
			if(!isConnected){
				if(ip_wlan0 === "192.168.3.1"){
				}else{	
					eventEmitter.emit('disconnected_resetup_ap');
				}
			}
		}
	},options.CONNECTION_TIMEOUT);

	setTimeout(function(){
		setInterval(function(){
			if(!isBusy){
				if(!isConnected){
					if(ssid){
						eventEmitter.emit('wifi_disconnected');
					}
				}
			}
		},options.WIFI_RECONNECT_TIMEOUT);
	},options.WIFI_RECONNECT_TIMEOUT);

	eventEmitter.on('disconnected_resetup_ap',function(){
		isBusy = true;
		console.error("device " + serial + " too long without connection. restarting AP");
		wifiscanner.setupAP(options,function handle_error(err,data){
			if(err){
				console.error(err);
			}
			isBusy = false;
		});	
	});


	eventEmitter.on('wifi_disconnected',function(){
		isBusy = true;
		wifiscanner.connectToWifi(ssid,passphrase,options,function handle_error(err,data){
			if(err){
				console.error(err);	
			}
			console.info("wait 10 seconds");
				
			setTimeout(function(){
				isBusy = false;
				console.info("wait over");
			},10000);
		});							
	});
	
	eventEmitter.on('connected', function(){
	
		var optionsget = {
			host : options.SERVER_URL,
			path : '/device/' + serial + '/gatewaywlan0/' + gateway_wlan0 + '/gatewayeth0/' + gateway_eth0 + '/type/' + type + '/ipwlan0/' + ip_wlan0 + '/ipeth0/' + ip_eth0, // the rest of the url with parameters if needed
		};
		// do the GET request
		var reqGet = http.get(optionsget, function(res) {
			console.info("device (" + serial + ") data pushed with statusCode: ", res.statusCode);
		});

		reqGet.end();
		reqGet.on('error', function(e) {
			console.error(e);
		});
	});
	
	
    app.use(express.static(__dirname + '/../public'))

    app.listen(use_port, function() {
        console.info('Wifi connector app listening on port : ' + use_port);
		wifiscanner.init(options,function(err,data){
			if(err){
				console.error(err);
			}else{
				eventEmitter.emit('disconnected_resetup_ap');
			}
		});
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
		ssid = req.body['essid'];
		passphrase = req.body['passphrase'];
		res.redirect('/pending.html?serial=' + serial);	
		setTimeout(function(){
			eventEmitter.emit('wifi_disconnected');
		},1000);
	});
}
