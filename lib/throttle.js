var Promise = require('bluebird');

function guard(condition, f) {
    return function() {
	var args = [].slice.call(arguments);

	return Promise.resolve(condition()).bind(this).then(function(exit) {
	    return Promise.resolve(f.apply(this, args)).finally(exit);
	});
    };
}

function throttleOnce(f, delay) {
    var waiter = Promise.resolve();
    return function() {
        var args = arguments;
        var result = waiter.bind(this).then(function() {
            return f.apply(this, args);
        });
        waiter = waiter.then(function() {
            return Promise.delay(delay);
        });
        return result;
    };
}

function throttle(n, t) {
    var queue = [];
    for (var k = 0; k < n; ++k) {
        queue.push(Promise.resolve());
    }
    return function enter() {
        var resolve;
        var p = new Promise(function(resolve_) {
            resolve = resolve_;
        });
        queue.push(p);
        return queue.shift().then(function() {
            Promise.delay(t).then(resolve);
        });
    };
}

exports.guard = guard;
exports.throttle = throttle;
exports.throttleOnce = throttleOnce;
