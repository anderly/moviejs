
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , request = require('request')
  , cheerio = require('cheerio')
  , util = require('util');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
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

	var id = req.params.id;
	var url = util.format('http://www.imdb.com/title/%s/', id);

	request(url, function(err, resp, body){
		$ = cheerio.load(body);

		var titleYear = new String($('meta[property="og:title"]').attr('content')).replace(/[\r\n\(\)]/gi,'');
		yearStart = titleYear.lastIndexOf(' ');
		var title = titleYear.substring(0, yearStart);
		var year = titleYear.substring(yearStart+1);
		var mpaa_rating = new String($('div.infobar img:first').attr('alt')).replace('_','-');
		var runtime = $('time[itemprop=duration]').text();
		var release_date = $('time[itemprop=datePublished]').attr('datetime');
		var genres = [];
		$('a[itemprop=genre]').each(function(i, link){
			genres.push($(link).text());
		});
		var metaDescription = new String($('meta[name=description]').attr('content'));
		/*var directorStart = metaDescription.indexOf('by ') + 3;
		var directorEnd = metaDescription.indexOf('.', directorStart);
		var director = metaDescription.substring(directorStart, directorEnd);*/
		var directorNode = $('a[itemprop=director]');
		var director = directorNode.text();
		var writers = [];
		directorNode.parent().next().children('a').each(function (i, link) {
			if ($(link).attr('href') != 'fullcredits#writers'){
				writers.push($(link).text());
			}
		});
		var actorStart = metaDescription.indexOf('With ') + 5;
		var actorEnd = metaDescription.indexOf('.', actorStart);
		var actors = metaDescription.substring(actorStart, actorEnd);
		var plot = $('p[itemprop=description]').text().replace(/[\r\n]/gi,'');
		var poster = $('img[itemprop=image]').attr('src');
		var poster_data = null;

		var uri = url;

		var model = {
				id: id
				,title: title
				,year: year
				,mpaa_rating: mpaa_rating
				,release_date: release_date
				,runtime: runtime
				,genre: genres.join(', ')
				,director: director
				,writer: writers.join(', ')
				,actors: actors
				,plot: plot
				,poster: poster
			};

		if (req.query.embed_poster) {
			request({uri: poster, encoding: 'binary'}, function(err, resp, body) {
				if (!err && resp.statusCode == 200) {
		        	//data_uri_prefix = "data:" + response.headers["content-type"] + ";base64,"
		        	poster_data = new Buffer(body.toString(), "binary").toString("base64");
		        	//image = data_uri_prefix + image
		        	model.poster_data = poster_data;
		        	model.uri = url;
		        	res.send(model).end();
		    	}
			});
		} else {
			model.uri = url;
			res.send(model).end();
		}
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
