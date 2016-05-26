#!/usr/bin/env node

/* globals require, console, __dirname, module, process */
/* jshint sub:true */

var cmdr    = require('commander');
var core    = require('./shared/promise-core');

cmdr.version('1.0.0')
    .option('-x, --exclude [filename]', 'An optional JSON file ' +
                'that maintains a list of URLs that have been ' +
                'printed already, and will not be printed again in ' +
                'successive runs.')
    .parse(process.argv);

var badConfMsg    = 'Could not read config file, please run setupPocketLs.js!';
var badOnceOutMsg = 'Could not write exclude file (' + cmdr.exclude + ')';
var conf = null;
var once = {};
var urls = '';

//Read "once" file
(cmdr.exclude ? core.readFile(cmdr.exclude) : Promise.resolve('[]'))
.then(function(onceRaw) {
    try { once = JSON.parse(onceRaw); }
    catch(e) {}

//Read pocket config file and parse it
}, function() {}).then(function() {
    return core.readFile(core.configFilename, badConfMsg);

}).then(function(dat) {
    return new Promise(function(yes, no) {
        try { conf = JSON.parse(dat); } catch(e) {}
        var confOk  = conf && conf['consumerKey'] && conf['access_token'];
        return !confOk ? no(badConfMsg) : yes();
    });

//Make call to pocket API
}).then(function() {
    return core.pocket('https://getpocket.com/v3/get', {
        'consumer_key': conf['consumerKey'],
        'access_token': conf['access_token'],
        'detailType': 'simple'
    });

//Exec command line program on each returned URL
}).then(function(dat) {
    var list = null;
    try { list = JSON.parse(dat)['list']; } catch(e) { }
    if (!list) {
        throw new Error('Pocket returned a bad JSON block.');
    }

    urls = Object.keys(list).reduce(function(urlList, keyNm) {
        var curUrl  = list[keyNm]['resolved_url'];
        if (!(curUrl in once)) { urlList.push(curUrl); }
        once[curUrl] = true;
        return urlList;
    }, []).join(' ');

//Write "once" file
}).then(function() {
    var onceJson = JSON.stringify(once, null, '    ');
    return cmdr.exclude ?
        core.writeFile(cmdr.exclude, onceJson, badOnceOutMsg) : 1;

}).then(function() {
    console.log(urls);

}).catch(function(e) {
    console.error('Error: ' + e);
});
