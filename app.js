
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');	
var util = require('util');
var stache = require('stache');
var system = require('./system');
var imdb = require('./lib/imdb');
var engines = require('consolidate');

var app = express();
app.engine('html', engines.hogan);

// set .html as the default extension 
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.set('layout', 'layout'); //# rendering by default
app.enable('view cache');
app.engine('html', require('hogan-express'));

// Configuration
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.removeHeader("X-Powered-By");
	res.removeHeader("Server");
	next();
});
//app.use(express.logger());
//app.use(express.bodyParser());
//app.use(express.methodOverride());
app.use('/assets',express.static(__dirname + '/assets'));
app.use('/v1', function(req, res, next){
	imdb.req = req;
	imdb.res = res;
	console.log('set req and res on imdb');
	next();
})
app.use(app.router);
// error handling middleware. Because it's
// below our routes, you will be able to
// "intercept" errors, otherwise Connect
// will respond with 500 "Internal Server Error".
app.use(function(err, req, res, next){
	if (err.message) {
	 	//res.send(err);
	 	res.statusCode = err.status;
		res.send({ statusCode: new String(err.status), message: new String(err.message) });
	}
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', routes.index);

app.get('/v1/titles/:id', function (req, res, next){
	res.contentType('application/json');
	return imdb.findById(req.params.id, function (err, movie) {
		if (!err) {
			return res.send(movie);
		} else {
			return next(err);
		}
	});
});

app.get('/v1/titles', function (req, res, next){
	res.contentType('application/json');
	if (req.query.search) {
    	imdb.search(req.query.search, function(err, results){
			if (!err) {
				return res.send(results);
			} else {
				return next(err);
			}
		})
    } else {
    	var err = new Error('Please provide a title id (/titles/:id) or a search term (?search=:term)');
    	err.status = 400;
    	next(err);
	}
});

app.listen(process.env.PORT || 3000);
//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
