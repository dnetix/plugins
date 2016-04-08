var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var swig = require('swig');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/examples/views');
// Disable SWIG caching for development
app.set('view cache', false);
swig.setDefaults({ cache: false });

app.use(express.static(path.resolve(__dirname, '../')));

// Parses the post parameters
app.use(bodyParser.urlencoded({ extended: true }));

// The two routes to use for the examples
app.get('/', function(req, res, next){
    res.render('index');
});

app.post('/reception', function(req, res, next){
    res.render('reception', req.body);
});

var server = app.listen(process.argv[2] || 8080, function(){
    console.log("Express server running on " + server.address().port);
});
