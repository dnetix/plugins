var express = require('express');
var app = express();
var path = require('path');
var swig = require('swig');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
// Disable SWIG caching for development
app.set('view cache', false);
swig.setDefaults({ cache: false });

app.use(express.static(path.resolve(__dirname, '../../')));

// The two routes to use for the examples
app.get('/', function(req, res, next){
    res.render('ohlc');
});

app.get('/rt', function(req, res, next){
    res.render('ohlc-realtime');
});

app.get('/intraday', function(req, res, next){
    res.render('intraday');
});

var server = app.listen(process.argv[2] || 8080, function(){
    console.log("Express server running on " + server.address().port);
});
