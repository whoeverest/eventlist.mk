var $$ = React.createElement;

var Router = ReactRouter;
var Route = React.createFactory(Router.Route);
var RouteHandler = Router.RouteHandler;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;
var Link = Router.Link;

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
        var coverImageEl = $$(Link, { to: '/e/' + this.props.id },
            $$('div', { className: 'cover-image', style: style })
        );

        var venue = this.props.location ? smartShorten(this.props.location, 25) : '<нема локација>';
        var venueText = ' ' + venue;

        if (this.props.distanceFromUser) {
            venueText += ' (' + this.props.distanceFromUser.toFixed(2) + 'km' + ')';
        }

        var venueEl = $$('div', { className: 'venue' }, venueText);
        var timeEl = $$('strong', { className: 'time' }, ' ' + timestampText);

        return $$('div', { className: 'event-thumbnail'},
                     coverImageEl,
                     $$('div', { className: 'info' },
                           $$(Link, { className: 'name', to: '/e/' + this.props.id }, this.props.name),
                           $$('div', { className: 'whereabout' }, timeEl, venueEl)));
    }
});

var EventGroup = React.createClass({
    displayName: 'EventGroup',
    render: function() {
        var items = this.props.events.map(function(ev) {
            return $$(EventThumbnail, ev);
        });
        return $$('div', { className: 'event-group' },
            $$('h1', { className: 'header' }, this.props.day),
            $$('div', null, items));
    }
});

var HomepageList = React.createClass({
    displayName: 'HomepageList',
    getInitialState: function() {
        return { events: [] };
    },
    render: function() {
        var groups = _.groupBy(this.props.events, nearTodayGroups);

        var items = _.map(groups, function(val, key) {
            return $$(EventGroup, { day: key, events: val });
        });

        return $$('div', null,
            $$('div', { className: 'event-list' }, items)
        );
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

        if (!messageId) { return $$('div', null); }

        return $$('div', { className: 'notification alert-' + messageObj.type }, messageObj.message);
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
        return $$('div', null, content);
    }
});

var Header = React.createClass({
    displayName: 'Header',
    render: function() {
        var logo = $$(Link, { to: '/', className: 'title-link' }, $$('h1', { className: 'title' }, 'EventList.mk'));
        var stats = $$('h4', null, $$(Stats, null));
        var description = $$('span', { className: 'header-description' },
                                 "Aгрегатор на јавни Facebook настани. Листата се генерира автоматски. Сакаш да придонесеш?");
        var addEventsBtn = $$('a', { className: 'btn btn-primary', href: "/auth/facebook"},
                               $$('span', { className: 'glyphicon glyphicon-plus'}),
                               ' Додади ги и моите настани!');
        var askLocationBtn = $$('a', { className: 'btn btn-default btn-sm', onClick: this.props.askForLocation },
                                 $$('span', { className: 'glyphicon glyphicon-map-marker' }),
                                 ' Лоцирај ме');

        return $$('div', null,
                     logo,
                     stats,
                     $$('div', { className: 'header-description-wrap' }, description),
                     $$('div', { className: 'btn-group', role: 'group'},
                           addEventsBtn));
    }
});

var DetailsPage = React.createClass({
    displayName: 'testClass',
    contextTypes: {
        router: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return { e: {} };
    },
    componentWillMount: function() {
        var self = this;
        var eventId = this.context.router.getCurrentParams()['eventId'];
        $.getJSON('/events/' + eventId, function(e) {
            self.setState({ e: e });
        });
    },
    render: function() {
        if (!this.state.e.id) {
            return $$('div', null, 'Loading');
        }

        var ev = this.state.e;

        var imgStyle = { backgroundImage: 'url(' + coverImage(ev) + ')' };

        return $$('div', { className: 'details-wrap' },
            $$('div', { style: imgStyle, className: 'details-image' }),
            $$('h1', null, ev.name),
            $$('h4', null, ev.location + ' / ' + moment(ev.start_time).format('D.M.YY / HH:mm')),
            $$('p', { className: 'details-description' }, ev.description),
            $$('a', { href: 'https://facebook.com/' + ev.id }, 'Настанот на Facebook')
        );
    }
});

var App = React.createClass({
    displayName: 'App',
    getInitialState: function() {
        return { events: [] };
    },
    componentWillMount: function() {
        var self = this;
        $.getJSON('/events', function(events) {
            events = _.sortBy(events, function(ev) {
                return ev.start_time;
            });
            self.setState({ events: events });
        });
    },
    render: function() {
        return $$('div', null,
            $$(Header, null, { askForLocation: this.askForLocation }),
            $$(RouteHandler, { events: this.state.events })
        );
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

var routes = (
    $$(Route, { name: "app", path: "/", handler: App },
        $$(DefaultRoute, { handler: HomepageList }),
        $$(Route, { name: "e/:eventId", handler: DetailsPage }),
        $$(NotFoundRoute, { handler: HomepageList })
    )
);

Router.run(routes, function(Handler) {
    React.render($$(Handler, null), document.getElementById("app"));
});

// React.render($$(App), document.getElementById("app"));
React.render($$(Notification), document.getElementById("notification-wrap"));
