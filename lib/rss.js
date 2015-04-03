var Feed = require('feed');
var db = require('./db-service');

var rss = new Feed({
    title: 'Eventlist.mk',
    description: 'Листа на настани во Скопје и Македонија',
    link: 'http://eventlist.mk',
    author: {
        name: 'Андреј Т.',
        email: 'andrejtrajchevski@gmail.com',
        link: 'https://github.com/whoeverest'
    }
});

module.exports = function getFeed() {
    return db.events.comingInDays().then(function(events) {
        events.forEach(function(e) {
            var item = {};

            item.title = e.name;
            item.link = 'https://facebook.com/' + e.id;

            if (e.start_time) {
                var date = new Date(e.start_time);
                item.date = date;
            }

            if (e.location) {
                item.description = 'Локација: ' + e.location;

                if (e.start_time) {
                    item.description += ' / ' + date.toDateString();
                }
            }

            rss.addItem(item);
        });

        return rss.render('rss-2.0');
    });
}
