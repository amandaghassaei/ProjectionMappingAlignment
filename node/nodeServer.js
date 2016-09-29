/**
 * Created by ghassaei on 9/29/16.
 */


//var http = require('http');
//var app = http.createServer();
var io = require('socket.io').listen(8080);
var PythonShell = require('python-shell');
//var app = require('express')();
//var http = require('http').Server(app);
//var io = require('socket.io')(http);

//var pyshell = new PythonShell('node/test.py', { mode: 'text '});
//pyshell.send('message');

io.on('connection', function(socket) {

    console.log("connected");

    socket.on('rotation', function (value) {
        console.log("sending " + value);
        PythonShell.run('node/stepper_angles.py', {args: ["[[" + value + "]]"]}, function (err) {
          if (err) throw err;
          console.log("finished");
        });
    });

});
