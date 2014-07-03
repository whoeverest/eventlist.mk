var D = React.DOM;

var Event = React.createClass({
    displayName: 'Event',
    render: function() {
        return D.div(
            { className: 'event'},
            D.div({ className: 'name' }, this.props.name),
            // D.span({ className: 'start-time' }, this.props.start_time.toString()),
            D.div({ className: 'venue' }, this.props.location ? this.props.location : '-')
        );
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

var EventList = React.createClass({
    displayName: 'EventList',
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
        return { events: [] };
    },
    render: function() {
        var groups = _.groupBy(this.state.events, function(ev) {
            return ev.start_time.substr(0, 10);
        });
        var items = _.map(groups, function(val, key) {
            return EventGroup({ day: key, events: val });
        });
        return D.div({ className: 'event-list' }, items);
    }
});

var testEvents = [{
    name: 'Kurac',
    start_time: new Date(),
    venue: 'La kurac'
}];

React.renderComponent(EventList({ events: testEvents }), document.getElementById("app"));
