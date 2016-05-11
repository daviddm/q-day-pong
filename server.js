/**
 * Created by daviddm on 2014-02-28.
 */

//var express = require('express');
//var app = express();
//app.listen(8080);
//var io = require('socket.io').listen(app);

//app.configure(function(){
//    app.use('/js', express.static(__dirname + '/js'));
//    app.use(express.logger('dev'));
//});
//
//app.get('/', function(req, res){
////    res.render('index.html');
////    fs.readFile(__dirname + '/index.html', 'utf8', function(err, text){
////        res.send(text);
////    });
//    res.sendfile(__dirname + '/index.html');
//});


var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server, { log: false });
server.listen(8080);
console.log('Started on port 8080')

var PlayersController = function(){
    var that = {};
    this.player_one = false;
    this.player_two = false;
    that.canJoin = function() {
        return !this.player_one || !this.player_two;
    };
    that.freeID = function() {
        if(!this.player_one) {
            this.player_one = true;
            return 1;
        } else if (!this.player_two) {
            this.player_two = true;
            return 2;
        }
        return false;
    };
    that.removePlayer = function(id) {
        if(id === 1) {
            this.player_one = false;
        } else if(id === 2) {
            this.player_two = false;
        }
    };
    return that;
};
var players = new PlayersController();

var GameServer = function(){
    var that = {};
    var player_positions = [];
    var ball_positions = [];
    var ball_delta = [];
    var score = [];

//    player_positions[1] = {pos:50};
//    player_positions[2] = {pos:50};
//    ball_positions[1] = {x:50, y:50};
//    ball_delta[1] = {x:2, y:2};

    that.playerData = function(pid, o) {
        if(o.beta > 30) {
//            console.log('Player '+pid+', Hard Left');
            movePlayer(pid, -o.beta*0.03);
        } else if(o.beta > 10) {
//            console.log('Player '+pid+', Left');
            movePlayer(pid, -o.beta*0.03);
        } else if(o.beta < -30) {
//            console.log('Player '+pid+', Hard Right');
            movePlayer(pid, -o.beta*0.03);
        } else if(o.beta < -10) {
//            console.log('Player '+pid+', Right');
            movePlayer(pid, -o.beta*0.03);
        } else {
//            console.log('Player '+pid+', Neutral');
        }
    };

    var movePlayer = function(pid, move) {
        player_positions[pid].pos += move;
        if(player_positions[pid].pos > 100) {
            player_positions[pid].pos = 100;
        } else if(player_positions[pid].pos < 0) {
            player_positions[pid].pos = 0;
        }
//        console.log('Position '+pid+' '+player_positions[pid].pos);
    };

    that.initBall = function(i, x, y, dx, dy) {
        ball_positions[i] = {x:x , y:y};
        ball_delta[i] = {x:dx, y:dy};
    };
    that.init = function() {
        score[1] = 0;
        score[2] = 0;
    };
    that.restart = function() {
        player_positions[1] = {pos:50};
        player_positions[2] = {pos:50};
//        that.initBall(1, Math.random() * 99 + 1, 50, -2, -2);
        that.initBall(1, 50, 50, 0, -1.2);
    };

    that.moveBall = function() {
        for(var i in ball_positions) {
            ball_positions[i].x += ball_delta[i].x;
            ball_positions[i].y += ball_delta[i].y;
            if(ball_positions[i].x > 100) {
                ball_positions[i].x = 100 - (ball_positions[i].x - 100);
                ball_delta[i].x = -ball_delta[i].x;
            } else if(ball_positions[i].x < 0) {
                ball_positions[i].x = -ball_positions[i].x;
                ball_delta[i].x = -ball_delta[i].x;
            }
            if(ball_positions[i].y > 100 && !isBallOut()) {
                ball_positions[i].y = 100 - (ball_positions[i].y - 100);
                ball_delta[i].y = -ball_delta[i].y;
            } else if(ball_positions[i].y < 0 && !isBallOut()) {
                ball_positions[i].y = -ball_positions[i].y;
                ball_delta[i].y = -ball_delta[i].y;
            }
        }
    };

    var isBallOut = function() {
        if(ball_positions[1].y <= 0) {
            // Player 1
            if(player_positions[1].pos < ball_positions[1].x + 15 && player_positions[1].pos > ball_positions[1].x - 15) {
                calcBallDelta();
                return false;
            } else {
                score[2]++;
                that.restart();
                return true;
            }
        } else {
            // Player 2
            if(player_positions[2].pos < ball_positions[1].x + 15 && player_positions[2].pos > ball_positions[1].x - 15) {
                calcBallDelta();
                return false;
            } else {
                score[1]++;
                that.restart();
                return true;
            }
        }
        return false;
    };

    var calcBallDelta = function() {
        var delta;
        if(ball_positions[1].y <= 0) {
            // Player 1
            delta = -(player_positions[1].pos - ball_positions[1].x) / 5;
        } else {
            // Player 2
            delta = -(player_positions[2].pos - ball_positions[1].x) / 5;
        }
        ball_delta[1].x = delta;
    };

    that.getPositions = function() {
        return {players: player_positions, balls: ball_positions, score: score};
    };

    return that;
};
var game = new GameServer();
game.init();
game.restart();
setInterval(game.moveBall, 25);

io.of('/device').on('connection', function (socket) {
    console.log('Connected');
    socket.emit('connected');
    socket.on('getPlayerID', function (callback) {
        console.log('Gettin Player ID');
        if(players.canJoin()) {
            var id = players.freeID();
            socket.set('pid', id, function() {
                console.log('player id ------ '+id);
                callback({id: id});
            });
        } else {
            callback({id: null});
        }
    });
    socket.on('gyro', function (player_id, gyro, callback) {
//        console.log("Recieved");
        game.playerData(player_id, gyro);
    });
    socket.on('disconnect', function () {
        console.log('Disconnect');
        socket.get('pid', function(err, pid) {
            console.log('Player '+pid+' left');
            players.removePlayer(pid);
        });
    });
});

io.of('/screen').on('connection', function (socket) {
    console.log('Connected');
    socket.emit('connected');
    socket.on('disconnect', function () {
        console.log('Disconnect Screen');
    });
    socket.on('restart', function () {
        game.restart();
    });
    socket.on('resetScore', function () {
        game.init();
    });
    setInterval(function(){
        socket.emit('positions', game.getPositions());
    }, 25);
});

app.configure(function(){
    app.use('/js', express.static(__dirname + '/js'));
    app.use('/img', express.static(__dirname + '/img'));
    app.use(express.logger('dev'));
});

app.get('/', function(req, res){
//    res.render('index.html');
//    fs.readFile(__dirname + '/index.html', 'utf8', function(err, text){
//        res.send(text);
//    });
    res.sendfile(__dirname + '/index.html');
});
