/* globals require, console */

var express    = require('express');
var bodyParser = require('body-parser');
var request    = require('request');
var handlebars = require('express-handlebars');
var app = express();
var port = 8424;

app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/config', function(req, res) {
    var consumerKey = req.body && req.body['consumerKey'];
    if (!consumerKey) {
        res.render('message', {
            error: true,
            message: 'No consumer key given!'
        });
    } else {
        request({
            url: 'https://getpocket.com/v3/oauth/request',
            method: 'POST',
            json: true,
            body: JSON.stringify({
                'consumer_key': consumerKey,
                'redirect_uri': 'http://localhost:' + port + '/done'
            })
        }, function(err, body) {
            if (err) {
                res.render('message', {
                    error: true,
                    message: 'We could not get a request token from pocket! ' +
                             'It may be down. It returned: ' + err
                });
            } else {
                console.log(body);
                res.render('message', {msg: 'foo'});
            }
        });
    }
});

app.use(express.static('public'));

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://localhost:%s', host, port);
});
