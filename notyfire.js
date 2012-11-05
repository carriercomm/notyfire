/*
 * NotyFire v2.0
 * Copyright 2012 FriendCo.de
 */


// Modules imports
var redisio = require("redis")
var socketio = require('socket.io')

exports.channels = {};

exports.listen = function(server) {
    // Channels
    exports.channels = {};

    // Init message queue in Redis
    var redis = redisio.createClient();
    redis.subscribe('notyfire');
    redis.on("message", function(channel, message) {
        try{
            message = JSON.parse(message);
        }
        catch (SyntaxError){return false;}
        
        for (var channel in message) {
            exports.transmit(channel,message[channel]);
        }
    });

    // Init socket.io
    exports.io = socketio.listen(server, {
        resource: '/backends/notyfire'
    });
    exports.io.sockets.on('error', function (reason){
        console.error('Unable to connect Socket.IO', reason);
    });

    exports.io.sockets.on('connection', function (socket) {
        socket.on('subscribe', function (channel) {
            exports.subscribe(channel,socket);
        });
        socket.on('unsubscribe', function (chnnale) {
            exports.unsubscribe(channel,socket);
        });
        socket.on('disconnect', function () {
            
        });
    });
};

// Validate args
// channel must be first argument and must be != undefined
function requiresChannel(func) {
    function f() {
        if(arguments[0] === undefined) {
            return false;
        }
        return func.apply(this, arguments);
    }
    return f;
}

/* Subscribe a socket to a channel */
exports.subscribe = requiresChannel(function(channel,socket) {
    socket.join(channel);
});

/* Unsubscribe a socket to a channel*/
exports.unsubscribe = requiresChannel(function(channel,socket) {
    socket.leave(channel);
});


/* Transmit data in channel */
exports.transmit = requiresChannel(function(channel,message){
    exports.io.sockets.json.in(channel).emit(channel,message);
});
