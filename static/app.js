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

// end of helpers

var EventThumbnail = React.createClass({
    displayName: 'EventThumbnail',
    render: function() {
        var timestampText = formatTimestamp(this.props.start_time);
        // var venueUrl = (this.props.venue && this.props.venue.id) ?
        //     ('http://facebook.com/' + this.props.venue.id) : '#';
        var eventUrl = 'http://facebook.com/' + this.props.id;
        var imgUrl = coverImage(this.props);

        var style = { backgroundImage: 'url(' + imgUrl + ')' };
        var coverImageEl = D.a({ href: eventUrl }, D.div({
            className: 'cover-image', style: style
        }));

        var venue = smartShorten(this.props.location, 30) || '<нема локација>';

        return D.div({ className: 'event-thumbnail'},
                     coverImageEl,
                     D.div({ className: 'info' },
                           D.div({ className: 'whereabout' },
                                 D.div({ className: 'time' }, timestampText),
                                 D.div({ className: 'venue' }, venue)),
                           D.a({ className: 'name', href: eventUrl }, this.props.name)));
    }
});

var Event = React.createClass({
    displayName: 'Event',
    render: function() {
        var startDate = new Date(this.props.start_time);
        var minutes = startDate.getMinutes();
        var hours = startDate.getHours();

        var venueEl;
        if (this.props.venue && this.props.venue.id && this.props.location) {
            venueEl = D.a({
                href: 'http://facebook.com/' + this.props.venue.id,
                className: 'location'}, this.props.location);
        } else {
            var locationText = this.props.location ? this.props.location : '/';
            venueEl = D.span(null, locationText);
        }

        if (minutes.toString().length === 1) {
            minutes = '0' + minutes;
        }

        if (hours.toString().length === 1) {
            hours = '0' + hours;
        }

        if (isYesterday(startDate) || isToday(startDate) || isTomorrow(startDate)) {
            return EventThumbnail(this.props);
        } else {
            return D.div(
                { className: 'event'},
                D.a({ href: 'http://facebook.com/' + this.props.id},
                    D.div({ className: 'name' }, this.props.name)),
                D.div({ className: 'whereabouts'},
                      D.span({ className: 'start-time' }, D.b(null, moment(this.props.start_time).fromNow())),
                      venueEl));
        }
    }
});

var EventGroup = React.createClass({
    displayName: 'EventGroup',
    render: function() {
        var items = this.props.events.map(Event);
        return D.div(
            { className: 'event-group' },
            D.h3({ className: 'header' }, this.props.day),
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
        return { events: [], filterText: '' };
    },
    updateFilter: function(e) {
        this.setState({
            events: this.state.events,
            filterText: e.target.value
        });
    },
    render: function() {
        var groups = _.groupBy(this.state.events, nearTodayGroups);

        var items = _.map(groups, function(val, key) {
            return EventGroup({ day: key, events: val });
        });

        return D.div({ className: 'event-list' }, items);
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
            'Корисници: ' + this.state.userCount +
            ' / Настани: ' + this.state.eventCount +
            ' / Освежено: ' + (this.state.lastRefreshed ? moment(this.state.lastRefreshed).fromNow() : 'не знам кога.');
        return D.div(null, D.div(null, content));
    }
});

React.renderComponent(App(), document.getElementById("app"));
React.renderComponent(Notification(), document.getElementById("notification-wrap"));
React.renderComponent(Stats(), document.getElementById("stats"));
