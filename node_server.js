// http://nodejs.org/api.html#_child_processes
var fs = require('fs');
var essid;
var passphrase;

var sys = require('util');
var exec = require('child_process').exec;
var path = require('path');

var express = require('/home/pi/node-v4.3.2-linux-armv6l/node_modules/express'),
    app     = express(),
    port    = 3000;

app.use(express.static('public'))
	
var bodyParser = require('/home/pi/node-v4.3.2-linux-armv6l/node_modules/body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function parse_iwlist_wlan0(input_text){
        var networks = [{channel:15}];
        var last_offset = 0;
        var offset;
        var i = 0;
        if(input_text != null){
			while((last_offset = input_text.indexOf("Cell ",last_offset)) != -1){

					//PARSE CELL
					var cell_terminator = last_offset + 7; // =  input_text.indexOf('/r',last_offset);
					last_offset = last_offset + 5;
					var cell = input_text.substring(last_offset,cell_terminator);

					//PARSE CHANNEL
					last_offset = input_text.indexOf("Channel:",last_offset);
					var channel_terminator = input_text.indexOf("\n",last_offset);
					last_offset = last_offset + 8;
					var channel = input_text.substring(last_offset,channel_terminator);

					//PARSE QUALITY
					last_offset = input_text.indexOf("Quality=",last_offset);
					var quality_terminator = input_text.indexOf(" ",last_offset);
					last_offset = last_offset + 8;
					var quality = input_text.substring(last_offset,quality_terminator);

					//PARSE ENCRYPTION
					last_offset = input_text.indexOf("Encryption key:",last_offset);
					var encryption_terminator = input_text.indexOf("\n",last_offset);
					last_offset = last_offset + 15;
					var encryption = input_text.substring(last_offset,encryption_terminator);

					//PARSE EESID
					last_offset = input_text.indexOf("ESSID:",last_offset);
					var essid_terminator = input_text.indexOf("\n",last_offset);
					last_offset = last_offset + 7;
					var essid = input_text.substring(last_offset,essid_terminator-1);



					networks[i] = {cell:cell,channel:channel,quality:quality,essid:essid,encryption:encryption};
					i++;
			}
		}
        return networks;
}

var output;
var networks;

exec("sudo iwlist wlan0 scan", function (error, stdout, stderr) {
	  if(error){
		  console.log(stderr);
	  }else{
		  output = stdout;
	  }
	  networks = parse_iwlist_wlan0(output);
});

app.get('/wifi_list',function(req,res){
  var command = exec("sudo iwlist wlan0 scan", function (error, stdout, stderr) {
	  if(error){
		  console.log(stderr);
	  }else{
		  output = stdout;
	  }
	  networks = parse_iwlist_wlan0(output);
  });
  command.stdout.on('data', function (data) {
	process.stdout.write(data);
  });

  
  res.json(networks);
  res.end();
});


app.get('/',function (req, res) {
  res.sendFile(__dirname + "/public/index_top.html");
  res.end();
  
});

app.listen(3000, function() {
        console.log('Raspbian wifi app listening on port 3000!');
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
		command.stdout.on('data', function (data) {
			process.stdout.write(data);
		});
		
		res.end();
});