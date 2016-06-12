// http://nodejs.org/api.html#_child_processes
var fs = require('fs');
var path = require('path');
var wifi = require('./wifi-scanner/wifi-scanner.js');
var express = require('express'),
    app     = express(),
    port    = 80;

var wificonnector = exports;

var exec = require('child_process').exec;

var bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


wificonnector.start = function() {
    app.use(express.static('public'))
        



    var apn_command = exec("sudo ./setup_wifi_apn.sh", function (error, stdout, stderr) {
        if(error){
            console.log(stderr);
        }
    });
        apn_command.stdout.on('data', function (data) {
        process.stdout.write(data);
    });



    app.get('/wifi_list',function(req,res){
      wifi.scan(function(err,data){
            if(err){
                console.log("wifiscanner : " + err);
                return
            }
            console.log("wifiscanner : start of list");
            for(i=0;i<data.length;i++){
                console.log("wifiscanner : " + data[i].essid);
            }
            console.log("wifiscanner : end of list");
            res.json(data);
            res.end();
      });
     
    });


    app.get('/',function (req, res) {
      res.sendFile(__dirname + "/public/index_top.html");
      res.end();
      
    });

    app.listen(80, function() {
            console.log('wifi connector app listening on 192.168.3.1');
    });

    app.post('/connect', function(req, res) {
            console.log((essid = req.body['essid']));
            console.log((passphrase = req.body['passphrase']));
            res.write("Trying wifi settings ... If Pi3-AP is no longer appearing then wifi should be connected.");

            var command = exec("sudo ./setup_wifi_connection.sh " + essid + " " + passphrase, function (error, stdout, stderr) {
                if(error){
                    console.log(stderr);
                }
            });
            command.on('close', function(code) {
                console.log('closing code: ' + code);
                if(code==0){
                    console.log("all ok !")
                }else{
                    exec("sudo ./setup_wifi_apn.sh", function (error, stdout, stderr) {
                        if(error){
                            console.log(stderr);
                        }
                    });
                }
            });
            command.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
            
            res.end();
    });
}
