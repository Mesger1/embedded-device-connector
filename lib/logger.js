var winston = require('winston');
 

 
var logger = new (winston.Logger)({
	transports: [
	  new (winston.transports.Console)({
		  level: 'debug',
		  formatter: function(options) {
		  	return winston.config.colorize(options.level, options.level.toUpperCase()) +' '+ winston.config.colorize(options.level, options.message ? options.message : '');
		  }
      }),
      new (winston.transports.File)({ 
		  level: 'debug',
		  filename: '/var/log/wifi-connector.log' 
	  })
    ]
});

function expandErrors(logger) {
  var oldLogFunc = logger.log;
  logger.log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (args.length >= 2 && args[1] instanceof Error) {
      args[1] = args[1].stack;
    }
    return oldLogFunc.apply(this, args);
  };
  return logger;
}

expandErrors(logger);

exports.logger = logger;