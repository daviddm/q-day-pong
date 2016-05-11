/**
 * Created by daviddm on 2014-02-28.
 */

com.screen = (function() {
    var that = {};
    this.debug = false;
    this.socket;
    this.player = null;
    this.PIXI;
    this.stage = null;
    this.renderer = null;
    this.ball;
    this.block = [];
    this.interpolate_index = 0;
    this.canvas_size = 640;

    this.o = null; // All Server Data
    this.o_last = null;

    var init = function() {
        console.log('Screen Init');

        this.socket = com.screen.socket();
//        this.socket.addServerListening();
        this.serverListenerDebug();
        this.socket.connect(function() {

        }, this.serverListener);
        addRestartButton();
        addScoreButton();

        this.PIXI = require(["js/pixi/bin/pixi.dev.js"], function(pixi) {
            this.PIXI = pixi;
            setupCanvas();
        });
    };

    this.serverListener = function(data) {
        if(this.debug) {
            this.trackingDebugEvent(data);
        }
        this.o_last = this.o;
        this.o = data;
    };

    var addRestartButton = function() {
        var b = document.createElement("button");
        b.value = "Restart";
        b.innerText = "Restart";
        var self = this;
        b.onclick = function() {
            console.log("Restart");
            self.socket.restart();
        };
        document.body.appendChild(b);
    };

    var addScoreButton = function() {
        var b = document.createElement("button");
        b.value = "0 - 0";
        b.innerText = "0 - 0";
        var self = this;
        b.onclick = function() {
            console.log("Reset Score");
            self.socket.resetScore();
        };
        document.body.appendChild(b);
    };

    var setupCanvas = function() {
        this.stage = new this.PIXI.Stage(0xFFFFFF);
        this.renderer = new this.PIXI.autoDetectRenderer(this.canvas_size, this.canvas_size, false, true);
        document.body.appendChild(this.renderer.view);

        var assetsToLoader = ["/img/bollar.png", "/img/block.png"];
        loader = new this.PIXI.AssetLoader(assetsToLoader);
        loader.onComplete = function(){onAssetsLoaded()};
        loader.load();
    };

    var onAssetsLoaded = function() {
        this.ball = PIXI.Sprite.fromImage("/img/bollar.png");
        this.ball.anchor.x = 0.5;
        this.ball.anchor.y = 0.5;
        this.ball.scale = {x:0.5, y:0.5};
        this.stage.addChild(this.ball);
        this.block[1] = PIXI.Sprite.fromImage("/img/block.png");
        this.block[1].anchor.x = 0.5;
        this.block[1].anchor.y = 0.5;
        this.stage.addChild(this.block[1]);
        this.block[2] = PIXI.Sprite.fromImage("/img/block.png");
        this.block[2].anchor.x = 0.5;
        this.block[2].anchor.y = 0.5;
        this.block[2].position.y = 100 * scaleFactor();
        this.stage.addChild(this.block[2]);
        setInterval(animate, 25);
    };

    var animate = function() {
//        requestAnimFrame( animate );
        if(this.o == null) {
            return;
        }
        this.ball.position.x = (this.o.balls[1].x + interpolate("ball", "x")) * scaleFactor();
        this.ball.position.y = (this.o.balls[1].y + interpolate("ball", "y")) * scaleFactor();

        this.block[1].position.x = this.o.players[1].pos * scaleFactor();
        this.block[2].position.x = this.o.players[2].pos * scaleFactor();
        renderer.render(this.stage);
    };

    var interpolate = function(type, axis) {
        return 0;
        this.interpolate_index++;
        if(this.interpolate_index > 4) {
            this.interpolate_index = 1;
        }
        if(this.o_last == null) {
            return 0;
        }
        if(type == "ball") {
            if(axis == "x") {
                return (this.o.balls[1].x - this.o_last.balls[1].x) / 4 * this.interpolate_index;
            } else {
                return (this.o.balls[1].y - this.o_last.balls[1].y) / 4 * this.interpolate_index;
            }
        }
        return 0;
    };

    var scaleFactor = function() {
        return this.canvas_size / 100;
    };

    this.serverListenerDebug = function() {
        this.debug = true;
        var tracking_container = document.createElement('div');
        tracking_container.id = "trackingContainer";

        var tracking_list = document.createElement('ul');
        tracking_list.id = "trackingList";

        var tracking_x = document.createElement('li');
        tracking_x.id = "player_1";
        var tracking_y = document.createElement('li');
        tracking_y.id = "player_2";
        var tracking_z = document.createElement('li');
        tracking_z.id = "ball";
        var tracking_score = document.createElement('li');
        tracking_score.id = "score";

        tracking_list.appendChild(tracking_x);
        tracking_list.appendChild(tracking_y);
        tracking_list.appendChild(tracking_z);
        tracking_list.appendChild(tracking_score);

        tracking_container.appendChild(tracking_list);

        document.body.appendChild(tracking_container);
    };

    this.trackingDebugEvent = function(o) {
        var p = o.players;
        var b = o.balls;
        document.getElementById("player_1").innerText = "Player 1: "+ p[1].pos;
        document.getElementById("player_2").innerText = "Player 2: "+ p[2].pos;
        document.getElementById("ball").innerText = "Ball: X:"+ b[1].x +" Y:"+ b[1].y;
        document.getElementById("score").innerText = "Score: "+o.score[1]+ " - "+ o.score[2];
    };

    require(["js/pixi/bin/pixi.dev", "/socket.io/socket.io.js"], function(){ init(); });

    return that;
})();

com.screen.socket = function() {
    that = {};
    this.socket;
    this.position_callback = false;
    that.connect = function(callback, position_callback) {
        console.log('Connecting Sockets');
        this.position_callback = position_callback;
        this.socket = require("/socket.io/socket.io.js").connect('/screen');
        this.socket.on('connect', function (data) {
            console.log('Sockets Connected');
            callback();
        });
        this.socket.on('disconnected', function() {
            socket.emit('disconnect');
        });
        this.socket.on('positions', function (data) {
            if(position_callback != null) {
                position_callback(data);
            }
        });
    };
    that.addServerListening = function(callback) {
        console.log('Adding Server Listening');
        this.position_callback = callback;
        console.log(this.position_callback);
    };
    that.restart = function() {
        this.socket.emit('restart');
    };
    that.resetScore = function() {
        this.socket.emit('resetScore');
    };
    return that;
};