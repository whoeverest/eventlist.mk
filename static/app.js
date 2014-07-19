var D = React.DOM;

var EventThumbnail = React.createClass({
    displayName: 'EventThumbnail',
    render: function() {
        var started = moment(this.props.start_time).diff(Date.now()) < 0;

        var timestampText;
        if (started) {
            timestampText = 'почна ' + moment(this.props.start_time).fromNow();
        } else {
            timestampText = 'почнува ' + moment(this.props.start_time).fromNow();
        }

        var venueUrl = 'http://facebook.com/' + this.props.venue.id;
        var eventUrl = 'http://facebook.com/' + this.props.id;

        var topPart = D.div({ className: 'top-part' },
                            D.a({ className: 'location-url', href: venueUrl },
                                D.span({ className: 'location' }, this.props.location)),
                            D.br(null),
                            D.span({ className: 'start-time' }, timestampText));

        var bottomPart = D.div({ className: 'bottom-part' },
                               D.span({ className: 'name' }, this.props.name));

        var imgUrl;
        if (this.props.cover && this.props.cover.source) {
            imgUrl = this.props.cover.source;
        } else {
            imgUrl = 'http://lorempixel.com/555/200/abstract/';
        }

        var style = {
            backgroundImage: 'url(' + imgUrl + ')'
        };

        return D.div({ className: 'event-thumbnail', style: style},
                     D.a({ className: 'event-url', href: eventUrl }, topPart, bottomPart));
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
            var locationText = this.props.location ? this.props.location : '';
            venueEl = D.span(null, locationText);
        }

        if (minutes.toString().length === 1) {
            minutes = '0' + minutes;
        }

        if (hours.toString().length === 1) {
            hours = '0' + hours;
        }

        return EventThumbnail(this.props);

        return D.div(
            { className: 'event'},
            D.a({ href: 'http://facebook.com/' + this.props.id},
                D.div({ className: 'name' }, this.props.name)),
            D.div({ className: 'whereabouts'},
                  D.span({ className: 'start-time' }, D.b(null, moment(this.props.start_time).fromNow())),
                  venueEl));
    }
});

var EventGroup = React.createClass({
    displayName: 'EventGroup',
    render: function() {
        var items = this.props.events.map(Event);
        return D.div(
            { className: 'event-group' },
            D.h2({ className: 'header' }, this.props.day),
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
        var filtered = _.filter(this.state.events, function(e) {
            var filterTextLower = self.state.filterText.toLocaleLowerCase();
            var inName =  e.name.toLocaleLowerCase().indexOf(filterTextLower) >= 0;
            var inDescription = e.description ?
                e.description.toLocaleLowerCase().indexOf(filterTextLower) >= 0 :
                false;
            var inLocation = e.location ?
                e.location.toLocaleLowerCase().indexOf(filterTextLower) >= 0 :
                false;
            return inName || inDescription || inLocation;
        });
        var groups = _.groupBy(filtered, function(ev) {
            var oneDay = 24 * 60 * 60 * 1000;
            if (moment(ev.start_time).dayOfYear() ===
                moment(Date.now()).dayOfYear()) {
                return '# денес';
            } else if (moment(ev.start_time).dayOfYear() ===
                       moment(Date.now() + oneDay).dayOfYear()) {
                return '# утре';
            } else if (moment(ev.start_time).dayOfYear() ===
                       moment(Date.now() - oneDay).dayOfYear()) {
                return '# вчера';
            } else {
                return '# здравје боже';
            }
            //return moment(ev.start_time).format('dddd[, ]Do MMMM');//format('LL');
        });
        var items = _.map(groups, function(val, key) {
            return EventGroup({ day: key, events: val });
        });
        return D.div(
            { className: 'event-list' },
            D.input({
                type: 'text',
                className: 'search-box',
                value: this.state.filterText,
                onChange: this.updateFilter,
                placeholder: 'Пребарај...'
            }),
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

        if (!messageId) { return; }
        
        return D.div({ className: 'notification alert-' + messageObj.type }, messageObj.message);
    }
});

React.renderComponent(App(), document.getElementById("app"));
React.renderComponent(Notification(), document.getElementById("notification-wrap"));
