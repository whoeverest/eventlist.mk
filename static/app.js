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
        return 'денес, ' + dayOfWeek;
    } else if (isTomorrow(ev.start_time)) {
        return 'утре, ' + dayOfWeek;
    } else if (isYesterday(ev.start_time)) {
        return 'вчера, ' + dayOfWeek;
    } else {
        return 'здравје боже';
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

// end of helpers

var EventThumbnail = React.createClass({
    displayName: 'EventThumbnail',
    onClick: function(event) {
        window.open('http://facebook.com/' + this.props.id);
    },
    render: function() {
        var timestampText = formatTimestamp(this.props.start_time);

        var venueUrl = (this.props.venue && this.props.venue.id) ?
            'http://facebook.com/' + this.props.venue.id:
            '#';
        var eventUrl = 'http://facebook.com/' + this.props.id;

        var topPart = D.div({ className: 'top-part' },
                            D.a({ className: 'location-url', href: venueUrl },
                                D.span({ className: 'location' }, this.props.location || '/')),
                            D.br(null),
                            D.span({ className: 'start-time' }, timestampText));

        var bottomPart = D.div({ className: 'bottom-part' },
                               D.a({ className: 'event-url', href: eventUrl },
                                   D.span({ className: 'name' },
                                          this.props.name)));

        var imgUrl = coverImage(this.props);

        var style = {
            backgroundImage: 'url(' + imgUrl + ')'
        };

        var innerEl = D.div({ className: 'overlay' }, topPart, bottomPart);

        return D.div({ className: 'event-thumbnail', style: style, onClick: this.onClick}, innerEl);
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
            var events = _.sortBy(events, function(ev) {
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
        var self = this;
        // var filtered = _.filter(this.state.events, function(e) {
        //     var filterTextLower = self.state.filterText.toLocaleLowerCase();
        //     var inName =  e.name.toLocaleLowerCase().indexOf(filterTextLower) >= 0;
        //     var inDescription = e.description ?
        //         e.description.toLocaleLowerCase().indexOf(filterTextLower) >= 0 :
        //         false;
        //     var inLocation = e.location ?
        //         e.location.toLocaleLowerCase().indexOf(filterTextLower) >= 0 :
        //         false;
        //     return inName || inDescription || inLocation;
        // });

        var groups = _.groupBy(this.state.events, nearTodayGroups);

        var items = _.map(groups, function(val, key) {
            return EventGroup({ day: key, events: val });
        });

        return D.div(
            { className: 'event-list' },
            // D.input({
            //     type: 'text',
            //     className: 'search-box',
            //     value: this.state.filterText,
            //     onChange: this.updateFilter,
            //     placeholder: 'Пребарај...'
            // }),
            items);
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

React.renderComponent(App(), document.getElementById("app"));
React.renderComponent(Notification(), document.getElementById("notification-wrap"));
