var winston = require('winston');
 

 
var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			level: 'debug',
		      formatter: function(options) {
				  return winston.config.colorize(options.level, options.level.toUpperCase()) +' '+ winston.config.colorize(options.level,(undefined !== options.message ? options.message : ''));
		      }
		    }),
      new (winston.transports.File)({ filename: 'wifi-connector.log' })
    ]
});

exports.logger = logger;