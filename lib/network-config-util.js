var child_process = require('child_process');
var fs = require("fs");
var ps = require('ps-node');
var child_process = require("child_process");
var logger = require('./logger.js');
var console = logger.logger;

function exec(command,callback){
	console.debug("exec : " + command);
	var childProcess = child_process.exec(command,callback);
}

function execSync(command,callback){
	console.debug("exec : " + command);
	var childProcess = child_process.execSync(command,callback);
	return childProcess;
}

function checkRunningAndKill(name,callback){
	console.debug("checking " + name);
	ps.lookup({
		command: name,
		psargs: ''
		}, function(err, resultList ) {
		if (err) {
			console.error(err);
			callback("error running/kill " + name + " " + err,null);
		}

		resultList.forEach(function( process ){
			if( process ){
				console.debug( name + ' running on PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
				exec("sudo kill " + process.pid,function handle_error(err,data){
					if(err){
						console.log(err);
					}
				});
			}
		});
		callback(null,"done");
	});
}

function wpa_enable(options,ssid,passphrase,callback) {
	var file = options.TMP_DIR + "/" +  options.INTERFACE + '-wpa_supplicant.conf';

	var command = 'wpa_passphrase "' + ssid + '" "' + passphrase
	+ '" > ' + file + ' && wpa_supplicant -i ' + options.INTERFACE + ' -B -D '
	+ options.DRIVER + ' -c ' + file

	exec(command,function handle_error(err,data){
		if(err){
			console.log(err);
		}
		callback(null,'done')
	});  
}

function down(options, ip, callback) {
	exec('ifconfig ' + options.INTERFACE + ' ' + ip + ' down',function handle_error(err,data){
		if(err){
			console.log(err);
		}
		callback(null,'done')
	});  
}

function up(options, ip, callback) {
	exec('ifconfig ' + options.INTERFACE + ' ' + ip + ' up',function handle_error(err,data){
		if(err){
			console.log(err);
		}
		callback(null,'done')
	});  
}

function kill_dnsmasq_and_hostapd(callback){
	checkRunningAndKill("hostapd",function handle_error(err,data){
		if(err){
			callback("error checking/killing hostapd",null);
		} 
		exec("pkill dnsmasq",function handle_error(err,data){
			if(err){
				callback("error checking/killing hostapd",null);
			} 
			callback(null,"done");
		});
	});
}

function restart_dnsmasq_and_hostapd(callback){
	exec("/etc/init.d/hostapd restart",function handle_error(err,data){
		if(err){
			callback("error restarting hostapd",null);
		}
		exec("/etc/init.d/dnsmasq restart",function handle_error(err,data){
			if(err){
				callback("error restarting dnsmasq",null);
			}
			callback(null,"done");
		});
	});
}

function backup_and_set_dhcpcd_conf(options,isDeny,callback){
	if(fs.existsSync('/etc/dhcpcd.conf.wc_backup.orig')){
		console.warn('dhcpcd.conf already has a backup');
	} else{
		if(fs.existsSync('/etc/dhcpcd.conf')){
			execSync('mv /etc/dhcpcd.conf /etc/dhcpcd.conf.wc_backup.orig');
			console.debug('/etc/dhcpcd.conf backed up to /etc/dhcpcd.conf.wc_backup.orig');
		}else{
			console.debug('no original dhcpcd.conf to backup');
		}
	}
	exec('rm -rf /etc/dhcpcd.conf',function(err,data){
		if(err){
			callback(err,data);
		}
		fs.writeFile('/etc/dhcpcd.conf', isDeny ? 'denyinterfaces ' + options.INTERFACE : ' ');
		console.debug('/etc/dhcpcd.conf set');
		callback(null,"done");
	});
}

function backup_and_set_network_interfaces(options,isWpa,callback){
	if(fs.existsSync('/etc/network/interfaces.wc_backup.orig')){
			console.warn('/etc/network/interfaces already has a backup');
	}else{
		if(	fs.existsSync('/etc/network/interfaces')){
			exec('mv /etc/network/interfaces /etc/network/interfaces.wc_backup.orig');
			console.debug('/etc/network/interfaces backed up to /etc/network/interfaces.wc_backup.orig');
		}else{
			console.debug('no original /etc/network/interfaces to backup');
		}
	}
	
	exec('rm -rf /etc/network/interfaces',function(err,data){
		if(err){
			callback(err,null)
		}
			
		fs.writeFile('/etc/network/interfaces', 
			'# interfaces(5) file used by ifup(8) and ifdown(8)\n' +
			'\n' +
			'# Please note that this file is written to be used with dhcpcd\n' +
			"# For static IP, consult /etc/dhcpcd.conf and 'man dhcpcd.conf'\n" +
			'\n' +
			'# Include files from /etc/network/interfaces.d:\n' +
			'source-directory /etc/network/interfaces.d\n' +
			'\n' +
			'auto lo\n' +
			'iface lo inet loopback\n' +
			'\n' +
			'iface eth0 inet manual\n' +
			'\n' +
			'allow-hotplug ' + options.INTERFACE + '\n' +
			'iface ' + options.INTERFACE + ' inet manual\n' +
			(isWpa ? ' ' : '#') +
			'    wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf\n'
		);
		console.debug('/etc/network/interfaces set');
		callback(null,"done");
	});
}


function backup_and_set_hostapd_conf(options,callback){
	if(fs.existsSync('/etc/hostapd/hostapd.conf.wc_backup.orig')){
			console.warn('/etc/hostapd/hostapd.conf already has a backup');
	}else{
		if(	fs.existsSync('/etc/hostapd/hostapd.conf')){
			exec('mv /etc/hostapd/hostapd.conf /etc/hostapd/hostapd.conf.wc_backup.orig');
			console.debug('/etc/hostapd/hostapd.conf backed up to /etc/hostapd/hostapd.conf.wc_backup.orig');
		}else{
			console.debug('no original /etc/hostapd/hostapd.conf to backup');
		}
	}
	
	exec('rm -rf /etc/hostapd/hostapd.conf',function(err,data){;
		if(err){
			callback(err,null);
		}
		fs.writeFile('/etc/hostapd/hostapd.conf', 
			'interface=' + options.INTERFACE + '\n' +
			'driver=' + options.DRIVER + '\n' +
			'ssid=' + options.AP_SSID + '\n' +
			'hw_mode=' + options.HW_MODE + '\n' +
			'channel=' + options.CHANNEL + '\n' +
			'ieee80211n=' + options.IEEE80211N + '\n' +
			'wmm_enabled=' + options.WMM_ENABLED + '\n' +
			'ht_capab=' + options.HT_CAPAB + '\n' +
			'macaddr_acl=' + options.MACADDR_ACL + '\n' +
			'auth_algs=' + options.AUTH_ALGS + '\n' +
			'wpa=' + options.WPA + '\n' +
			'wpa_key_mgmt=' + options.WPA_KEY_MGMT + '\n' +
			'wpa_passphrase=' + options.PASSPHRASE + '\n' +
			'rsn_pairwise=' + options.RSN_PAIRWISE + '\n'
		);
		console.debug('/etc/hostapd/hostapd.conf set');
		callback(null,"done");
	});
}

function wpa_config(ssid,passphrase,options,callback){
	var file = options.TMP_DIR + "/" +  options.INTERFACE + '-wpa_supplicant.conf';
	exec('rm -rf ' + file,function(err,data){
		if(err){
			callback(err,null);
		}
		fs.writeFile(file, 
			'network={\n' +
			'	ssid="' + ssid + '"\n' + 
			'	psk="' + passphrase + '"\n' +
			'}\n'
		,function(err,data){
			exec('wpa_supplicant -i ' + options.INTERFACE + ' -B -D '+ options.DRIVER + ' -c ' + file,function(err,data){
				if(err){
					console.error(err);
					callback(err,null);
				}
				console.debug(file + " set");
				callback(null,"done");
			});
		});
		
	});
}

function backup_and_set_dnsmasq_conf(options,callback){
	if(fs.existsSync('/etc/dnsmasq.conf.wc_backup.orig')){
		console.warn('/etc/dnsmasq.conf already has a backup');
	}else{
		if(fs.existsSync('/etc/dnsmasq.conf')){
			exec('mv /etc/dnsmasq.conf /etc/dnsmasq.conf.wc_backup.orig');
			console.debug('/etc/dnsmasq.conf backed up to /etc/dnsmasq.conf.wc_backup.orig');
		}else{
			console.debug('no original /etc/dnsmasq.conf to backup');
		}
	}
	
	exec('rm -rf /etc/dnsmasq.conf',function(err,data){
		if(err){
			callback(err,null);
		}
		fs.writeFile('/etc/dnsmasq.conf', 
			'interface=' + options.INTERFACE + '\n' +
			'listen-address=' + options.AP_IP_ADDRESS + '\n' +
			'bind-interfaces' + '\n' +
			'server=' + options.SERVER + '\n' +
			'domain-needed' + '\n' +
			'bogus-priv' + '\n' +
			'dhcp-range=' + options.DHCP_RANGE + '\n'
		);
		
		console.debug('/etc/dnsmasq.conf set');
		callback(null,"done");
	});
}
function findGateway(options,callback){
	var command =  "ip route show default | grep " + options.INTERFACE  + " | awk '/default/ {print $3}'";
	console.debug(command);
	var output = child_process.execSync(command);
	//todo hack for wait till output is populated
	setTimeout(function() { 
		console.debug(output.toString());
		if(output.toString() === ''){
			callback("gateway not found",null);
		}else{
			callback(null,"done");
		}
	},2000);
}

function addHardcodedWPA(options,callback){
	var source_file_path = '/etc/network/interfaces';

	fs.readFile(source_file_path, 'utf8', function (rfErr, rfData) {
		if (rfErr) {
			console.error("Could not read /etc/network/interfaces");
			callback(new Error("Could not read /etc/network/interfaces",null));
			return;
		}
		var fileData = rfData.toString();
		fileData = fileData.replace('#    wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf', '   wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf');
		fs.writeFile(source_file_path, fileData, 'utf8', function (wfErr) {
			if (wfErr) {
				console.error("Could not write /etc/network/interfaces");
				callback(new Error("Could not write /etc/network/interfaces",null));
				return;
			}
			exec("sudo mv " + options.TMP_DIR + "/" + options.INTERFACE + "-wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf",function(err,data){
					if(err){
						console.error("Could not copy conf to /etc/wpa_supplicant/wpa_supplicant");
						callback(new Error("Could not copy conf to /etc/wpa_supplicant/wpa_supplicant",null));
						return;						
					}
					callback(null,"Added Hardcoded WPA");
			});
		});
	});
	
}

function removeWificonnectorOnBoot(callback){
	var source_file_path = '/etc/rc.local';
	fs.readFile(source_file_path, 'utf8', function (rfErr, rfData) {
		if (rfErr) {
			console.error("Could not read /etc/rc.local");
			callback(new Error("Could not read /etc/rc.local",null));
			return;
		}
		var fileData = rfData.toString();
		fileData = fileData.replace('sudo wifi-connector &>/dev/null &', '');
		fs.writeFile(source_file_path, fileData, 'utf8', function (wfErr) {
			if (wfErr) {
				console.error("Could not write /etc/rc.local");
				callback(new Error("Could not write /etc/rc.local",null));
				return;
			}
			callback(null,"Removed wifi-connector on boot");
		});
	});
}

function checkInternet(){
	dns.resolve('www.google.com', function(err,data) {
		if (err == null) {
			console.debug("google found");
			return true;
		}
	});
	console.debug("google not found");
	return false;
}
exports.checkInternet = checkInternet;
exports.findGateway = findGateway;
exports.addHardcodedWPA = addHardcodedWPA;
exports.removeWificonnectorOnBoot = removeWificonnectorOnBoot;


exports.exec = exec;
exports.execSync = execSync;

exports.checkRunningAndKill = checkRunningAndKill;

exports.up = up;
exports.down = down;

exports.wpa_enable = wpa_enable;

exports.wpa_config = wpa_config;

exports.restart_dnsmasq_and_hostapd = restart_dnsmasq_and_hostapd;
exports.kill_dnsmasq_and_hostapd = kill_dnsmasq_and_hostapd;

exports.backup_and_set_dnsmasq_conf = backup_and_set_dnsmasq_conf;
exports.backup_and_set_dhcpcd_conf = backup_and_set_dhcpcd_conf;
exports.backup_and_set_network_interfaces = backup_and_set_network_interfaces
exports.backup_and_set_hostapd_conf = backup_and_set_hostapd_conf;