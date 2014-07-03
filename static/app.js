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
            return e.name.toLocaleLowerCase()
                .indexOf(self.state.filterText.toLocaleLowerCase()) >= 0;
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
