var child_process = require('child_process');
var fs = require("fs");
var logger = require('./logger.js');
var console = logger.logger;
var sync = require('synchronize');
 
sync(console,'debug','info','error');
sync(fs,'writeFile','exists');
sync(child_process,'exec');

 


function isRunning(name){
	child_process.exec("ps -cax | grep " + name,function(err,data,stderr){
		if(err){
			console.debug(name + " not running");
			return false;
		}else{
			if(data){
				console.debug(name + " running");
				return true;
			}else{
				console.debug(name + " not running");
				return false;
			}
		}
	})
}

function wpa_enable(options,ssid,passphrase) {
	var file = options.TMP_DIR + "/" +  options.INTERFACE + '-wpa_supplicant.conf';

	var command = 'wpa_passphrase "' + ssid + '" "' + passphrase
	+ '" > ' + file + ' && wpa_supplicant -i ' + options.INTERFACE + ' -B -D '
	+ options.DRIVER + ' -c ' + file

	return child_process.exec(command);  
}

function down(options, ip, callback) {
	child_process.exec('ifconfig ' + options.INTERFACE + ' ' + ip + ' down', callback);
}

function up(options, ip, callback) {
	child_process.exec('ifconfig ' + options.INTERFACE + ' ' + ip + ' up', callback);
}

function kill_dnsmasq_and_hostapd(callback){
	if(isRunning("hostapd")){
		child_process.exec("sudo pkill hostapd");
	}
	if(isRunning("dnsmasq")){
		child_process.exec("sudo pkill dnsmasq");	
	}
}

function restart_dnsmasq_and_hostapd(callback){
	child_process.exec("/etc/init.d/hostapd restart");
	child_process.exec("/etc/init.d/dnsmasq restart");
}

function backup_and_set_dhcpcd_conf(options,isDeny){
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
	child_process.exec('rm -rf /etc/dhcpcd.conf');
	fs.writeFile('/etc/dhcpcd.conf', isDeny ? 'denyinterfaces ' + options.INTERFACE : ' ');
	console.debug('/etc/dhcpcd.conf set');
}

function backup_and_set_network_interfaces(options,isWpa){
	if(fs.existsSync('/etc/network/interfaces.wc_backup.orig')){
			console.warn('/etc/network/interfaces already has a backup');
	}else{
		if(	fs.existsSync('/etc/network/interfaces')){
			child_process.exec('mv /etc/network/interfaces /etc/network/interfaces.wc_backup.orig');
			console.debug('/etc/network/interfaces backed up to /etc/network/interfaces.wc_backup.orig');
		}else{
			console.debug('no original /etc/network/interfaces to backup');
		}
	}
	
	child_process.exec('rm -rf /etc/network/interfaces');
		
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
}


function backup_and_set_hostapd_conf(options){
	if(fs.existsSync('/etc/hostapd/hostapd.conf.wc_backup.orig')){
			console.warn('/etc/hostapd/hostapd.conf already has a backup');
	}else{
		if(	fs.existsSync('/etc/hostapd/hostapd.conf')){
			child_process.exec('mv /etc/hostapd/hostapd.conf /etc/hostapd/hostapd.conf.wc_backup.orig');
			console.debug('/etc/hostapd/hostapd.conf backed up to /etc/hostapd/hostapd.conf.wc_backup.orig');
		}else{
			console.debug('no original /etc/hostapd/hostapd.conf to backup');
		}
	}
	
	child_process.exec('rm -rf /etc/hostapd/hostapd.conf');
		
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
}

function backup_and_set_dnsmasq_conf(options){
	if(fs.existsSync('/etc/dnsmasq.conf.wc_backup.orig')){
		console.warn('/etc/dnsmasq.conf already has a backup');
	}else{
		if(fs.existsSync('/etc/dnsmasq.conf')){
			child_process.exec('mv /etc/dnsmasq.conf /etc/dnsmasq.conf.wc_backup.orig');
			console.debug('/etc/dnsmasq.conf backed up to /etc/dnsmasq.conf.wc_backup.orig');
		}else{
			console.debug('no original /etc/dnsmasq.conf to backup');
		}
	}
	
	child_process.exec('rm -rf /etc/dnsmasq.conf');
		
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
}


exports.isRunning = isRunning;

exports.up = up;
exports.down = down;

exports.wpa_enable = wpa_enable;

exports.restart_dnsmasq_and_hostapd = restart_dnsmasq_and_hostapd;
exports.kill_dnsmasq_and_hostapd = kill_dnsmasq_and_hostapd;

exports.backup_and_set_dnsmasq_conf = backup_and_set_dnsmasq_conf;
exports.backup_and_set_dhcpcd_conf = backup_and_set_dhcpcd_conf;
exports.backup_and_set_network_interfaces = backup_and_set_network_interfaces
exports.backup_and_set_hostapd_conf = backup_and_set_hostapd_conf;