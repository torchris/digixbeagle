
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var request = require("request");
var temp = 100;
var app = express();
var server = require('http').createServer(app);
var ledStatOn = "ledOff";

//Get temp data from the DigiX with Request
function getData() {
    request({
		uri: "http://192.168.1.7:3010/temp"
	}, function(error, response, body) {
        if (error){
            //If there is an error or the DigiX is unreachable, set the value to an error.
            console.log("Error: DigiX not available");
            temp = "DigiX not available";
            }
		else if (!error && response.statusCode == 200) {
			var n = body.search("TEMP:");
			temp = body.substr((n + 6), 5);
			temp = temp.trim();
			console.log("Current temp reading: " + temp);
		}
	});
	setTimeout(getData, 10000);
}

getData();

// all environments
//app.set('port', process.env.PORT || 3015);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var io = require('socket.io').listen(server);
app.set('port', process.env.PORT || 3015);
io.set('log level', 0);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    res.render('index', {
		title: 'DigiX Socket.io'	
        });
    });

//Main socket.io function
io.sockets.on('connection', function(socket) {
	console.log('A new user connected!');
	console.log("Sending over initial LED state: " + ledStatOn);
	socket.broadcast.emit('ledStatOn', ledStatOn);
	setInterval(function() {
		socket.broadcast.emit('tempData', temp);
		console.log("Temp sent over sockets to client; " + temp);
	}, 10000);
	socket.on('ledStatOn', function(ledStatOn) {
		if (ledStatOn == "ledOn") {
			console.log('LED data = ' + ledStatOn);
			request({
				uri: "http://192.168.1.7:3010/on"
			}, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var x = body.search("ledCmded:");
					ledOnStat = body.substr((x + 10), 2);
					ledOnStat = ledOnStat.trim();
					console.log("LED status is " + ledOnStat);
					socket.emit('ledStatOn', ledOnStat);
				}
			});
		}
		else if (ledStatOn === "ledOff") {
			console.log('LED data = ' + ledStatOn);
			request({
				uri: "http://192.168.1.7:3010/off"
			}, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var x = body.search("ledCmded:");
					ledOnStat = body.substr((x + 10), 3);
					ledOnStat = ledOnStat.trim();
					console.log("LED status is " + ledOnStat);
					socket.emit('ledStatOn', ledOnStat);
				}
			});
		}
	});

});

server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

