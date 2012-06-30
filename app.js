
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
	app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', routes.index);

app.get('/v1/title/:id', function (req, res){

	res.contentType('application/json');

	imdb.findById(req, function(movie){
		res.send(movie).end();
	})
});

app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
