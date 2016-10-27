angular.module('technodeApp',['ngRoute']).run(function($window, $rootScope, $http, $location) {
	$http({
		url: '/api/validate',
		method: 'GET'
	}).success(function(user) {

		$rootScope.me = user
		$location.path('/')
	}).error(function(data) {
		$location.path('/login')
	});

	$rootScope.logout = function() {
		$http({
			url: '/api/logout',
			method: 'GET'
		}).success(function() {
			$rootScope.me = null
			$location.path('/login')
		})
	};

	$rootScope.$on('login', function(evt, me) {
		$rootScope.me = me
	})
})

angular.module('technodeApp').factory('socket', function($rootScope) {
	var socket = io.connect('/')

	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				var args = arguments
				$rootScope.$apply(function() {
					callback.apply(socket, args)
				})
			})
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				var args = arguments
				$rootScope.$apply(function() {
					if(callback) {
						callback.apply(socket, args)
					}
				})				
			})
		}
	}
})

angular.module('technodeApp').controller('RoomCtrl', function($scope, socket) {
	$scope.messages = [];
	socket.emit('getAllMessages');

	socket.on('AllMessages', function(messages) {

		$scope.messages = messages;
	});

	socket.on('roomData', function(room) {
		$scope.room = room
	})

	socket.on('messageAdded', function(message) {
		$scope.technode.messages.push(message)
	})

	socket.emit('getRoom')
})

angular.module('technodeApp').controller('MessageCreatorCtrl', function($scope, socket) {
	$scope.newMessage = '';

	$scope.createMessage = function() {
		if ($scope.newMessage == "") {
			return
		}

		socket.emit('createMessages', {
			message: $scope.newMessage,
			creator: $scope.me
		});
		
		$scope.newMessage = '';
	};
})

angular.module('technodeApp').controller('LoginCtrl', function($scope, $http, $location) {
	$scope.login = function () {
		
		$http({
			url: '/api/login',
			method: 'POST',
			data: {
				email: $scope.email
			}
		}).success(function(user) {
			$scope.$emit('login', user)
			$location.path('/')
		}).error(function() {
			$location.path('/login')
		})
	}	
})
 
// 指令 
angular.module('technodeApp').directive('autoScrollToBottom', function() {
	return {
		link: function(scope, element, attrs) {
			scope.$watch(
				function() {
					return element.children().length
				},
				function() {
					element.animate({
						scrollTop: element.prop('scrollHeight')
					}, 1000)
				}
			);
		}
	};
});

// 指令  按回车换行
angular.module('technodeApp').directive('ctrlEnterBreakLine', function() {
	return function(scope, element, attrs) {
		
		var ctrlDown = false;
		element.bind('keydown', function(evt) {

			if(evt.which === 17) {
				ctrlDown = true
				setTimeout(function() {
					ctrlDown = false
				}, 1000)
			}
			if (evt.which === 13) {
				if (ctrlDown) {
					element.val(element.val() + '\n')
				} else {
					scope.$apply(function() {
						scope.$eval(attrs.ctrlEnterBreakLine)
					});
					evt.preventDefault();
				}
			}
		});
	}
})

// 路由
angular.module('technodeApp').config(function($routeProvider, $locationProvider) {
	$locationProvider.html5Mode(true)
	$routeProvider.when('/', {
		templateUrl: '/pages/room.html',
		controller: 'RoomCtrl'
	})
	.when('/login', {
		templateUrl: '/pages/login.html',
		controller: 'LoginCtrl'		
	})
	.otherwise({
		redirectTo: '/login'
	})
})