var config = require('./network-config-util.js');
var fs = require("fs");
var logger = require('./logger.js');

var console = logger.logger;

function make_tmp_dir(options,callback){
	fs.exists(options.TMP_DIR,function(exists){
		if(exists){
			console.info("tmp dir was already created");
			callback(null,"tmp dir already created");
		}else{
			config.exec("mkdir " + options.TMP_DIR,function(err,data){
				if(err){
					console.error(err);
					callback(err,null);
				}
				console.info("created tmp dir");
				callback(null,"tmp dir created");
			});
		}
	});
}

function parse_environment(options,callback){
	var file = options.TMP_DIR + '/lsb_release.txt';
	var version;
	config.exec('lsb_release -a | tee ' + file ,function handle_error(err,data){
		if(err){
			console.error(err);
			callback(err,null);
		}
		var output = fs.readFileSync(file);
		version = output.toString().match(/Distributor ID:\t*([^\n\r]*)/)[1];
		console.debug("Parsed : " + version);
		callback(null,version);
	});
}

function get_pi_serial(callback){
	 	var data = config.execSync("cat /proc/cpuinfo | grep Serial | cut -d ':' -f 2");
		data = data.toString().replace('\n','');
		data = data.replace(' ','');
		console.debug("Serial : " + data);
		callback(null,data);
}

function get_ip_for_interface(interface,callback){
	var command =  "ifconfig " + interface + "  grep -oP '(?<=inet\s)\d+(\.\d+){3}'";
	console.debug(command);
	var output = config.execSync(command);
	output = output.toString().replace('\n','');
	if(output === ''){
		callback("gateway not found",null);
	}else{
		console.debug(output);
		callback(null,output);
	}
}


function get_gateway_for_interface(interface,callback){
	var command =  "ip route show default | grep " + interface + " | grep -oP '\d+(\.\d+){3}' | head -1";
	console.debug(command);
	var output = config.execSync(command);
	output = output.toString().replace('\n','');
	if(output === ''){
		callback("gateway not found",null);
	}else{
		console.debug(output);
		callback(null,output);
	}
}



exports.make_tmp_dir = make_tmp_dir;
exports.parse_environment = parse_environment;
exports.get_pi_serial = get_pi_serial;
exports.get_gateway_for_interface = get_gateway_for_interface;
exports.get_ip_for_interface = get_ip_for_interface;