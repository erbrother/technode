var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);

var port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '/static')));
app.use(function(req, res) {
	res.sendFile(path.join(__dirname, '/static/index.html'))
});

var io = require('socket.io')(server);
var messages= [];

io.on('connection', function(socket) {
	console.log('a user login');

	socket.on('getAllMessages', function() {
		socket.emit('AllMessages', messages)
	})	

	socket.on('createMessages', function(message) {
		messages.push(message)
		io.sockets.emit('messageAdded', message)
	})
})

server.listen(port, function() {
	console.log('listen at port:' + port )
});

changse