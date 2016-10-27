var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var bodyParse = require('body-parser');
var cookieParse = require('cookie-parser');
var session = require('express-session');
var Controllers = require('./controllers');
var signedCookieParser = cookieParse('technode')
var MongoStore = require('connect-mongo')(session)
var sessionStore = new MongoStore({
	url: 'mongodb://localhost/technode'
})
var port = process.env.PORT || 3000;

app.use(bodyParse.json())
app.use(bodyParse.urlencoded({
	extended: true
}))
app.use(cookieParse())
app.use(session({
	secret: 'technode',
	resave: true,
	saveUninitialized: true,
	cookie: {
		maxAge: 60 * 1000 * 60
	},
	store: sessionStore
}))

app.get('/api/validate', function(req, res) {
	var _userId = req.session._userId
	
	if ( typeof(_userId) !== "undefined" ) {
		Controllers.User.findUserById(_userId, function(err, user) {
			if (err) {
				res.json(401, {
					msg: err
				})
			} else {
				res.json(user)
			}
		})
	} else {
		res.json(401, null)
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

				Controllers.User.online(user._id, function(err, user) {
					if(err) {
						res.json(500, {
							msg: err
						})
					} else {
						res.json(user)
					}
				})

				res.json(user)
			}
		})
	} else {
		res.json(403)
	}
})

app.get('/api/logout', function(req, res) {
	_userId = req.session._userId
	req.session._userId = undefined
	
	Controllers.User.offline(user._id, function(err, user) {
		if(err) {
			res.json(500, {
				msg: err
			})
		} else {
			res.json(user)
			delete req.session._userId
		}
	})
	res.json(401)
})

app.use(express.static(path.join(__dirname, '/static')));
app.use(function(req, res) {
	res.sendFile(path.join(__dirname, '/static/index.html'))
});


var io = require('socket.io')(server);
var messages= [];

io.set('authorization', function(handshakeData, accept) {
	signedCookieParser(handshakeData, {}, function(err) {
		if (err) {
			accept(err, false)
		} else {
			sessionStore.get(handshakeData.signedCookies['connect.sid'], function(err, session) {
				if (err) {
					accept(err.message, false)
				} else {
					handshakeData.session = session
					
					if (session._userId) {
						accept(null, true)
					} else {
						accept('no login')
					}
				}
			})
		}
	})
})

io.on('connection', function(socket) {
	socket.on('getRoom', function() {
		Controllers.User.getOnlineUser
	})

	socket.on('createMessages', function(message) {
		messages.push(message)
		io.sockets.emit('messageAdded', message)
	})
})

server.listen(port, function() {
	console.log('listen at port:' + port )
}); 

