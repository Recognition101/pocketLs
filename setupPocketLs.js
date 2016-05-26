#!/usr/bin/env node

/* globals require, console, __dirname */
/* jshint sub:true */

var qs         = require('querystring');
var express    = require('express');
var bodyParser = require('body-parser');
var handlebars = require('express-handlebars');
var core       = require('./shared/promise-core');

var app = express();
var server = null;
var port = 8424;

app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/config', function(req, res) {
    var consumerKey = req.body && req.body['consumerKey'];
    var requestToken = '';
    new Promise(function(yes, no) {
        return consumerKey ? yes() : no('No consumer key given!');

    }).then(function() {
        return core.pocket('https://getpocket.com/v3/oauth/request', {
            'consumer_key': consumerKey,
            'redirect_uri': 'http://localhost:' + port + '/done'
        });

    }).then(function(body) {
        try { requestToken = (JSON.parse(body) || {})['code']; } catch(e) {}
        return core.appendToSettings({
            consumerKey: consumerKey,
            requestToken: requestToken
        });

    }).then(function() {
        res.redirect('https://getpocket.com/auth/authorize?' + qs.stringify({
            'request_token': requestToken,
            'redirect_uri': 'http://localhost:' + port + '/done'
        }));

    }).catch(function(e) {
        res.render('message', { error: true, message: e });
    });
});

app.all('/done', function(req, res) {
    var conf = null;
    var pRes = null;
    core.readFile(core.configFilename, 'Could not read the configuration ' +
                  'file! Please retry the setup process or check that this ' +
                  'file exists: ' + core.configFilename
    ).then(function(txt) {
        return new Promise(function(yes, no) {
            try { conf = JSON.parse(txt); } catch(e) {  }
            var valid = conf && conf['consumerKey'] && conf['requestToken'];
            return valid ? yes() : no('Could not read keys from ' +
                'the configuration file. Please re-try the setup process.');
        });

    }).then(function() {
        return core.pocket('https://getpocket.com/v3/oauth/authorize', {
            'consumer_key': conf['consumerKey'],
            'code': conf['requestToken']
        });
    }).then(function(txt) {
        try { pRes = JSON.parse(txt); } catch(e) {  }
        if (!pRes || !pRes['access_token'] || !pRes['username']) {
            throw new Error('Pocket did not respond correctly! Please try ' +
                            'the setup process again later.');
        }
        
        return core.appendToSettings({
            'access_token': pRes['access_token'],
            'username': pRes['username']
        });
    }).then(function() {
        res.render('message', { message: 'Pocket Ls is set up!' });
        console.log('Use ctrl+c to close this setup.');

    }, function(errTxt) {
        res.render('message', { error: true, message: errTxt });
    });
});

app.use(express.static('public'));

server = app.listen(port, function () {
  console.log('To set up Pocket Ls, please use a web browser and ' +
              'follow the instructions at this URL:\n\n' +
              '    http://localhost:' + port + '/\n');
});
