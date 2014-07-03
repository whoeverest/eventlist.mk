var thr = require('../lib/throttle');
var Promise = require('bluebird');

var counter = 0;


var n = Date.now();
function doThings() {
    return Promise.delay(Math.round(Math.random() * 2000)).then(function() {
        console.log(((Date.now() - n) / 1000).toFixed(1));
        console.log("Did", ++counter);
    });
}

var throttled = thr.guard(thr.throttle(3, 10000), doThings);

for (var k = 0; k < 20; ++k) {
    throttled();
}
