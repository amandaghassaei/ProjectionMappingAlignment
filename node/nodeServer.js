/**
 * Created by aghassaei on 6/17/15.
 */

var SerialPort = require('SerialPort');

var app = require('http').createServer();
var io = require('socket.io')(app);
app.listen(8080);

//defaults
var portName = "/dev/cu.usbserial-DA00XAJE";
var currentPort = null;
var baudRate = 115200;

io.on('connection', function(socket){

    var allPorts = [];
    refreshAvailablePorts(function(_allPorts, _portName, _baudRate){
        if (checkThatPortExists(_portName)){
            currentPort = changePort(_portName, _baudRate);
        } else {
            portName = _allPorts[0];
            currentPort = changePort(portName, _baudRate);
        }
        console.log(allPorts);
    });

    socket.on('baudRate', function(value){
        refreshAvailablePorts(function(){
            if (!checkThatPortExists(portName)) return;
            currentPort = changePort(portName, value);
            baudRate = value;
        });
    });

    socket.on('portName', function(value){
        refreshAvailablePorts(function(){
            if (!checkThatPortExists(value)) return;
            currentPort = changePort(value, baudRate);
            portName = value;
        });
    });

    socket.on('rotation', function(data){
        outputData(data);
    });

    function outputData(data){
        io.emit('dataSent', data);
        data += '\n';
        // console.log("Sending data: " + data);
        currentPort.write(new Buffer(data), function(err, res) {
            if (err) onPortError(err);
        });
//        currentPort.write(new Buffer([parseInt(data)]));//write byte
    }

    socket.on('flush', function(){
        if (currentPort) currentPort.flush(function(){
            console.log("port " + portName + " flushed");
        });
    });

    socket.on('refreshPorts', function(){
        console.log("refreshing ports list");
        allPorts = refreshAvailablePorts();
    });

    function checkThatPortExists(_portName){
        if (allPorts.indexOf(_portName) < 0) {
            onPortError("no available port called " + _portName);
            return false;
        }
        return true;
    }




    function refreshAvailablePorts(callback){
        var _allPorts = [];
        SerialPort.list(function(err, ports){
            ports.forEach(function(port) {
                _allPorts.push(port.comName);
            });

            allPorts = _allPorts;

            if (!portName && _allPorts.length>0) portName = _allPorts[0];
            if (callback) callback(allPorts, portName, baudRate);

            io.emit('connected', {
                baudRate: baudRate,
                portName: portName,
                availablePorts: _allPorts
            });
        });
    }

    function initPort(_portName, _baudRate){

        console.log("initing port " + _portName + " at " + _baudRate);
        var port = new SerialPort(_portName, {
            baudRate: _baudRate,
            parser: SerialPort.parsers.readline("\n"),
            autoOpen: false
        //       parser: SerialPort.parsers.raw
        });

        port.open(function(error){
            if (error) {
                onPortError(error);
                currentPort = null;
                return;
            }
            onPortOpen(_portName, _baudRate);
            port.on('data', onPortData);
            port.on('close', onPortClose);
            port.on('error', onPortError);
        });
        return port;
    }

    function changePort(_portName, _baudRate){
        console.log("change");
        if (!_portName) {
            onPortError("no port name specified");
            return null;
        }
        if (currentPort) {
            var oldBaud = baudRate;
            var oldName = portName;
            console.log("disconnecting port " + oldName + " at " + oldBaud);
            if (currentPort.isOpen()) currentPort.close(function(error){
                if (error) {
                    onPortError(error);
                    return null;
                }
                io.emit("portDisconnected", {baudRate:oldBaud, portName:oldName});
            });
        }
        return initPort(_portName, _baudRate);
    }

    function onPortOpen(name, baud){
        console.log("connected to port " + portName + " at " + baudRate);
        io.emit("portConnected", {baudRate:baud, portName:name});
    }

    function onPortData(data){
        console.log(data);
        io.emit('dataIn', data);
    }

    function onPortClose(){
//        console.log("port closed");
    }

    function onPortError(error){
        console.log("Serial port error " + error);
        io.emit("errorMsg", {error:String(error)});
    }

});






