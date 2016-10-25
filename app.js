var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var bodyParse = require('body-parse');
var cookieParse = require('cookie-parse');
var session = require('express-session');
var Controllers = require('./controllers');
var port = process.env.PORT || 3000;

app.use(bodyParse.json())
app.use(bodyParse.urlencoded({
	extended: true
}))
app.use(cookieParse())
app.use(session({
	secret: 'technode',
	resave: true,
	saveUnintialized: false,
	cookie: {
		maxAge: 60 * 1000
	}
}))

app.get('/api/login', function(req, res) {
	var _userId = req.session._userId
	if (_userId) {
		Controllers.User.findById(_userId, function(err, user) {
			if (err) {
				res.json(401, {
					msg: err
				})
			} else {
				res.json(user)
			}
		})
	}
})

app.post('/api/login', function(req, res) {
	var email = req.body.email
	if (email) {
		Controllers.User.findByEmailOrCreate(email, function(err, user) {
			if (err) { 
				res.json(500, {
					msg: err
				})
			} else {
				req.session._userId = user._id
				res.json(user)
			}
		})
	} else {
		res.json(403)
	}
})

app.get('/api/logout', function(req, res) {
	req.session._userId = null
	res.json(401)
})

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

