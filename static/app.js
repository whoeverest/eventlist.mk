var D = React.DOM;

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
                class: 'location'}, this.props.location);
        } else {
            var locationText = this.props.location ? this.props.location : '-';
            venueEl = D.span(null, locationText);
        }

        if (minutes.toString().length === 1) {
            minutes = '0' + minutes;
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
            var filterTextLower = self.state.filterText.toLocaleLowerCase()
            var inName =  e.name.toLocaleLowerCase().indexOf(filterTextLower) >= 0;
            var inDescription = e.description ?
                e.description.toLocaleLowerCase().indexOf(filterTextLower) >= 0 :
                true;
            var inLocation = e.location ?
                e.location.toLocaleLowerCase().indexOf(filterTextLower) >= 0 :
                true;
            return inName || inDescription || inLocation;
        });
        var groups = _.groupBy(filtered, function(ev) {
            return ev.start_time.substr(0, 10);
        });
        var items = _.map(groups, function(val, key) {
            return EventGroup({ day: key, events: val });
        });
        return D.div(
            { className: 'event-list' },
            D.input({
                type: 'text',
                value: this.state.filterText,
                onChange: this.updateFilter}),
            items);
    }
});

React.renderComponent(App(), document.getElementById("app"));
