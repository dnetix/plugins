var express = require('express');
var app = express();
var path = require('path');
var swig = require('swig');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/examples/views');
// Disable SWIG caching for development
app.set('view cache', false);
swig.setDefaults({ cache: false });

app.use(express.static(path.resolve(__dirname, '../')));

// The two routes to use for the examples
app.get('/', function(req, res, next){
    res.render('index');
});

app.get('/realtime', function(req, res, next){
    res.render('realtime');
});

app.get('/remote', function(req, res, next){
    res.render('remote');
});

var server = app.listen(process.argv[2] || 8080, function(){
    console.log("Express server running on " + server.address().port);
});
