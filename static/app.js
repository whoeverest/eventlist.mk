var D = React.DOM;

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

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

        return D.div(
            { className: 'event'},
            D.a({ href: 'http://facebook.com/' + this.props.id},
                D.div({ className: 'name' }, this.props.name)),
            D.div({ className: 'whereabouts'},
                  D.span({ className: 'start-time' }, hours + ':' + minutes),
                  venueEl));
    }
});

var EventGroup = React.createClass({
    displayName: 'EventGroup',
    render: function() {
        var items = this.props.events.map(Event);
        console.log(this.props.day);
        return D.div(
            { className: 'event-group' },
            D.h4({ className: 'header' }, this.props.day),
            D.div(null, items));
    }
});

var Alert = React.createClass({
    displayName: 'Alert',
    render: function() {
        var message, type;
        var messageSuccess = 'Успешно беа додадени твоите настани';
        var messageFailure = 'Имаше проблем при додавањето на твоите настани';

        var loginStatus = getParameterByName('loginStatus');

        if (loginStatus === 'success') {
            type = 'success';
            message = messageSuccess;
        } else if (loginStatus === 'error') {
            type = 'danger';
            message = messageFailure;
        }

        console.log(message, type);

        return D.div(
            { className: 'alert alert-' + type },
            message
        );
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
            return moment(ev.start_time).format('dddd[, ]Do MMMM');//format('LL');
        });
        var items = _.map(groups, function(val, key) {
            return EventGroup({ day: key, events: val });
        });
        return D.div(
            { className: 'event-list' },
            Alert(),
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

React.renderComponent(App(), document.getElementById("app"));
