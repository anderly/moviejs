
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');	
var util = require('util');
var stache = require('stache');
var system = require('./system');
var imdb = require('./lib/imdb');

var app = module.exports = express.createServer();
// Configuration

// app.configure(function(){
//   app.set('views', __dirname + '/views');
//   app.set('view engine', 'jade');
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(app.router);
//   app.use(express.static(__dirname + '/public'));
// });
// Configuration
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'mustache');
	app.register('.mustache', stache);
	//app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
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
		// res.contentType('application/json');
		// // special-case 404s,
		// // remember you could
		// // render a 404 template here
		// if (404 == err.status) {
		// 	res.statusCode = 404;
		// 	res.send({ statusCode: 400, message: "Please provide a title id (/titles/:id) or a search term (?search=:term)" });
		// } else {
		if (err.message) {
		 	//res.send(err);
		 	res.statusCode = err.status;
			res.send({ statusCode: new String(err.status), message: new String(err.message) });
		}
	});
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
	return imdb.findById(req.params.id, function (err, product) {
		if (!err) {
			return res.send(product);
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
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
