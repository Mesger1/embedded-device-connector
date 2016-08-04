#!/usr/bin/env node
(function() {
    var child_process = require("child_process");
    var oldSpawn = child_process.spawnSync;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    child_process.spawnSync = mySpawn;
})();

var app =  require('../lib/server');
app.start();