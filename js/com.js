/**
 * Created by daviddm on 2014-02-28.
 */

var com = (function() {
    var that = {};
//    function init() {
        if(navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
            require(["js/device"], function(util) {});
        } else {
            require(["js/screen"], function(util) {});
        }
//    }
    return that;
})();

