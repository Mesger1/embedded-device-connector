var exec = require('child_process').exec;

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

function scan(callback){
    exec("sudo iwlist wlan0 scan", function (error, stdout, stderr) {
	  if(error){
		  console.log("wifiscanner : " + stderr);
          callback(error,null);
          return;
	  }
	  callback(null,parse_iwlist_wlan0(stdout));
    });
}

exports.scan = scan;