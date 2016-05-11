/**
 * Created by daviddm on 2014-02-28.
 */

com.device = (function() {
    var that = {};
    this.debug = false;
    this.socket;
    this.player = null;
    this.last_gyro = null;

    var init = function() {
        console.log('Device Init');
//        gyro.startTracking(tracking);
        this.trackingDebug();
        com.device.render.init();
        this.socket = com.device.socket();
        this.socket.connect(function(){
            this.player = com.device.player;
            this.socket.getPlayerId(function(data) {
                if(data.id != null) {
                    this.player.setPlayerID(data.id)
                    canPlay();
                } else {
                    // Wait for empty slot
                    console.log('All slots is taken');
                }
            });
        });
    };

    var canPlay = function() {
        require("js/gyro").frequency = 50;
        require("js/gyro").startTracking(tracking)
    };

    var tracking = function(o) {
        if(this.debug) {
            this.trackingDebugEvent(o);
        }
        if(this.last_gyro != null && Math.abs(o.beta.toFixed(0)) < 2) {
            return;
        }
        this.last_gyro = o;
        this.socket.sendGyro(this.player.getPlayerID(), o)
//        console.log(o);
    };

    /**
     * The game server only reads the beta value, so we only check if theres any beta change
     */
    var compareGyro = function(a, b) {
        if(a.beta.toFixed(0) != b.beta.toFixed(0)) {
            return false;
        }
        return true;
    }

    this.trackingDebug = function() {
        this.debug = true;
        var tracking_container = document.createElement('div');
        tracking_container.id = "trackingContainer";

        var tracking_list = document.createElement('ul');
        tracking_list.id = "trackingList";

        var tracking_x = document.createElement('li');
        tracking_x.id = "tracking_x";
        var tracking_y = document.createElement('li');
        tracking_y.id = "tracking_y";
        var tracking_z = document.createElement('li');
        tracking_z.id = "tracking_z";

        tracking_list.appendChild(tracking_x);
        tracking_list.appendChild(tracking_y);
        tracking_list.appendChild(tracking_z);

        var tracking_alfa = document.createElement('li');
        tracking_alfa.id = "tracking_alfa";
        var tracking_beta = document.createElement('li');
        tracking_beta.id = "tracking_beta";
        var tracking_gamma = document.createElement('li');
        tracking_gamma.id = "tracking_gamma";

        tracking_list.appendChild(tracking_alfa);
        tracking_list.appendChild(tracking_beta);
        tracking_list.appendChild(tracking_gamma);

        tracking_container.appendChild(tracking_list);

        document.body.appendChild(tracking_container);
    };
    this.trackingDebugEvent = function(o) {
        document.getElementById("tracking_x").innerText = "X: "+ o.x;
        document.getElementById("tracking_y").innerText = "Y: "+ o.y;
        document.getElementById("tracking_z").innerText = "Z: "+ o.z;

        document.getElementById("tracking_alfa").innerHTML = "&Alpha;: "+ o.alpha;
        document.getElementById("tracking_beta").innerHTML = "&Beta;: "+ o.beta.toFixed(0);
        document.getElementById("tracking_gamma").innerHTML = "&Gamma;: "+ o.gamma;
    };

    require(["js/gyro", "/socket.io/socket.io.js"], function(){ init(); });

    return that;
})();

com.device.socket = function() {
    that = {};
    this.socket;
    that.connect = function(callback) {
        console.log('Connecting Sockets');
        this.socket = require("/socket.io/socket.io.js").connect('/device');
        this.socket.on('connect', function (data) {
            console.log('Sockets Connected');
            callback();
        });
        this.socket.on('disconnected', function() {
            socket.emit('disconnect');
        });
    };
    that.getPlayerId = function(callback) {
        console.log('Gettin Player ID');
        this.socket.emit('getPlayerID', function (data) {
            callback(data);
        });
    };
    that.sendGyro = function(player_id, gyro) {
        this.socket.emit('gyro', player_id, gyro, function (data) {
//            console.log(data);
        });
    };
    return that;
};

com.device.motion = (function() {

})();

com.device.player = (function(){
    var that = {};
    this.player_id = null;
    that.setPlayerID = function(id){this.player_id = id; console.log('Player ID = '+id);}
    that.getPlayerID = function(){return this.player_id}
    return that;
})();

com.device.render = (function() {
    var that = {};
    that.init = function() {
        console.log('Render Init');

    };
    this.setup = function() {

    };
    return that;
})();
