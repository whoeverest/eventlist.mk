var D = React.DOM;

// helpers

function isToday(dateObj) {
    return moment(dateObj).dayOfYear() ===
           moment(Date.now()).dayOfYear();
}

function isYesterday(dateObj) {
    var oneDay = 24 * 60 * 60 * 1000;
    return moment(dateObj).dayOfYear() ===
           moment(Date.now() - oneDay).dayOfYear();
}

function isTomorrow(dateObj) {
    var oneDay = 24 * 60 * 60 * 1000;
    return moment(dateObj).dayOfYear() ===
           moment(Date.now() + oneDay).dayOfYear();
}

function nearTodayGroups(ev) {
    var dayOfWeek = moment(ev.start_time).format('dddd');
    if (isToday(ev.start_time)) {
        return 'денес, ' + dayOfWeek + ':';
    } else if (isTomorrow(ev.start_time)) {
        return 'утре, ' + dayOfWeek + ':';
    } else if (isYesterday(ev.start_time)) {
        return 'вчера, ' + dayOfWeek + ':';
    } else {
        return 'здравје боже:';
    }
}

function isStarted(dateObj) {
    return moment(dateObj).diff(Date.now()) < 0;
}

function formatTimestamp(dateObj) {
    if (isTomorrow(dateObj)) {
        return 'почнува во ' + moment(dateObj).format('HH:mm');
    } else {
        if (isStarted(dateObj)) {
            return 'почна ' + moment(dateObj).fromNow() + ', во ' + moment(dateObj).format('HH:mm');
        } else {
            return 'почнува ' + moment(dateObj).fromNow() + ', во ' + moment(dateObj).format('HH:mm');
        }
    }
}

function coverImage(event) {
    if (event.cover && event.cover.source) {
        return event.cover.source;
    } else {
        return 'http://lorempixel.com/555/200/abstract/';
    }
}

function smartShorten(str, length) {
    var chunks = str.split(' ');
    var resArr = [];
    var letterCount = 0;
    var shortened = false;
    for (var i = 0; i < chunks.length; i++) {
        if (letterCount >= length) {
            shortened = true;
            break;
        }
        letterCount += chunks[i].length;
        resArr.push(chunks[i]);
    }

    var res = resArr.join(' ');

    if (shortened) {
        res += '...';
    }

    return res;
}

function distanceFromUserKm(event, userLocation) {
    if (!event.venue || !event.venue.latitude) {
        return null;
    }
    if (!userLocation) {
        return null;
    }

    return getDistanceFromLatLonInKm(event.venue.latitude,
                                     event.venue.longitude,
                                     userLocation.latitude,
                                     userLocation.longitude);
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// end of helpers

var EventThumbnail = React.createClass({
    displayName: 'EventThumbnail',
    render: function() {
        var timestampText = formatTimestamp(this.props.start_time);
        var eventUrl = 'http://facebook.com/' + this.props.id;
        var imgUrl = coverImage(this.props);

        var style = { backgroundImage: 'url(' + imgUrl + ')' };
        var coverImageEl = D.a({ href: eventUrl }, D.div({
            className: 'cover-image', style: style
        }));

        var venue = this.props.location ? smartShorten(this.props.location, 25) : '<нема локација>';
        var venueText = ' ' + venue;

        if (this.props.distanceFromUser) {
            venueText += ' (' + this.props.distanceFromUser.toFixed(2) + 'km' + ')';
         }

        var venueEl = D.div({ className: 'venue' },
                            D.span({ className: 'glyphicon glyphicon-home' }),
                            venueText);

        var timeEl = D.strong({ className: 'time' },
                              D.span({ className: 'glyphicon glyphicon-time' }),
                              ' ' + timestampText);

        return D.div({ className: 'event-thumbnail'},
                     coverImageEl,
                     D.div({ className: 'info' },
                           D.div({ className: 'whereabout' }, timeEl, venueEl),
                           D.a({ className: 'name', href: eventUrl }, this.props.name)));
    }
});

var EventGroup = React.createClass({
    displayName: 'EventGroup',
    render: function() {
        var items = this.props.events.map(EventThumbnail);
        return D.div(
            { className: 'event-group' },
            D.h1({ className: 'header' }, this.props.day),
            D.div(null, items));
    }
});

var App = React.createClass({
    displayName: 'App',
    componentWillMount: function() {
        var self = this;
        $.getJSON('/events', function(events) {
            events = _.sortBy(events, function(ev) {
                return ev.start_time;
            });
            self.setState({ events: events });
        });
    },
    getInitialState: function() {
        return { events: [] };
    },
    render: function() {
        var groups = _.groupBy(this.state.events, nearTodayGroups);

        var items = _.map(groups, function(val, key) {
            return EventGroup({ day: key, events: val });
        });

        return D.div(null,
                     Header({ askForLocation: this.askForLocation }),
                     D.div({ className: 'event-list' }, items));
    },
    updateUserPosition: function(coordObj) {
        if (!coordObj || !coordObj.coords || !coordObj.coords.latitude) {
            return;
        }
        var userLocation = {
            latitude: coordObj.coords.latitude,
            longitude: coordObj.coords.longitude
        };
        var eventsWithDist = this.state.events.map(function(ev) {
            ev.distanceFromUser = distanceFromUserKm(ev, userLocation);
            return ev;
        });
        this.setState({ events: eventsWithDist });
    },
    askForLocation: function() {
        navigator.geolocation.getCurrentPosition(this.updateUserPosition);
    }
});

var Notification = React.createClass({
    displayName: 'Notification',
    notifications: {
        'addEventsSuccess': {
            message: 'Успешно беа додадени твоите настани!',
            type: 'success'
        },
        'addEventsFail': {
            message: 'Се случи грешка при додавањето на твоите настани. :(',
            type: 'danger'
        }
    },
    _getQueryParams: function() {
        var urlParams;
        var match;
        var pl = /\+/g;  // Regex for replacing addition symbol with a space
        var search = /([^&=]+)=?([^&]*)/g;
        var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
        var query  = window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }

        return urlParams;
    },
    getMessageFromUrl: function() {
        var params = this._getQueryParams();
        return params.message;
    },
    render: function () {
        var messageId = this.getMessageFromUrl();
        var messageObj = this.notifications[messageId];

        if (!messageId) { return D.div(null); }

        return D.div({ className: 'notification alert-' + messageObj.type }, messageObj.message);
    }
});

var Stats = React.createClass({
    displayName: 'Stats',
    getInitialState: function() {
        return { userCount: 0, eventCount: 0, lastRefreshed: undefined };
    },
    componentWillMount: function() {
        var self = this;
        $.getJSON('/stats', function(stats) {
            self.setState({
                userCount: stats.userCount,
                eventCount: stats.eventCount,
                lastRefreshed: stats.lastRefreshed
            });
        });
    },
    render: function() {
        var content =
            'корисници: ' + this.state.userCount +
            ' / настани: ' + this.state.eventCount +
            ' / освежено: ' + (this.state.lastRefreshed ? moment(this.state.lastRefreshed).fromNow() : 'не знам кога.');
        return D.div(null, content);
    }
});

var Header = React.createClass({
    displayName: 'Header',
    render: function() {
        var logo = D.h1(null, 'EventList.mk');
        var stats = D.h4(null, Stats());
        var description = D.span({ className: 'header-description' },
                                 "Ти си поканет на некои настани на Facebook. Другарка ти на други. EventList.mk = твоите настани + нејзините.");
        var addEventsBtn = D.a({ className: 'btn btn-primary btn-sm', href: "/auth/facebook"},
                               D.span({ className: 'glyphicon glyphicon-plus'}),
                               ' Додади ги и моите Facebook настани');
        var askLocationBtn = D.a({ className: 'btn btn-default btn-sm', onClick: this.props.askForLocation },
                                 D.span({ className: 'glyphicon glyphicon-map-marker' }),
                                 ' Лоцирај ме');

        return D.div(null,
                     logo,
                     stats,
                     D.div({ className: 'header-description-wrap' }, description),
                     D.div({ className: 'btn-group', role: 'group'},
                           addEventsBtn,
                                  askLocationBtn));
    }
});

React.renderComponent(App(), document.getElementById("app"));
React.renderComponent(Notification(), document.getElementById("notification-wrap"));
