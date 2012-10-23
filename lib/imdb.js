var util = require('util');
var events = require('events');
var _ = require('underscore')._;
var config = require('../config');

var request = require('request');
var cheerio = require('cheerio');
var system = require('../system');

var rtg   = require('url').parse(config.connectionString);
var redis = require('redis').createClient(rtg.port, rtg.hostname);
var redisAuth = redis.auth(rtg.auth.split(':')[1]);

redis.on("error", function (err) {
    console.log("Error " + err);
});

var imdb = function() {
	var self = this;
	var req = null;
	var res = null;

	this.findById = function(id, callback) {
		_getCacheWithDefault(id, function(err, movie) {
			if (!err) {
				if (movie) {
					return callback(null, movie);
				} else {
					return _getResponse(id, function(err, movie) {
						return callback(err, movie); 
					});
				}
			} else {
				return console.log(err);
			}
		});
	};

	this.search = function(search, callback) {

		_getCacheWithDefault(escape(search), function(err, results) {
			if (!err) {
				if (results) {
					return callback(null, results);
				} else {
					return _getResults(search, function(err, results) {
						return callback(err, results); 
					});
				}
			} else {
				return console.log(err);
			}
		});

	};

	var _getCacheWithDefault = function(id, callback) {
		redis.get(id, function (err, reply) {
	        if (reply!='null' && reply!=null && !self.req.query.nocache) {
	        	console.log(util.format('%s found in cache', id));
	        	redis.expire(id, 60);
	        	//self.res.header('X-MovieJS-Cached',true);
	        	return callback(null, reply);
	        } else {
	        	//self.res.header('X-MovieJS-Cached',false);
	        	console.log(util.format('%s not found in cache', id));
	        	return callback(null, null);
	        }
	    });

	}; //END function getCacheWithDefault

	var _getResponse = function(id, callback) {
		var url = 'http://www.imdb.com/title/{id}/'.expand({ id: id });

		request(url, function(err, resp, body){
			//self.parseRequest(req, err, resp, body, callback);
			if (resp.statusCode == 404) {
				var err = new Error('title ({id}) not found'.expand({ id: id }));
	        	err.status = resp.statusCode;
	        	return callback(err);
			}

			$ = cheerio.load(body);

			var titleNode = $('h1[itemprop=name]');
			var titleYear = new String(titleNode.text()).replace(/[\r\n]/gi,'');//new String($('meta[property="og:title"]').attr('content')).replace(/[\r\n\(\)]/gi,'');
			yearStart = titleYear.indexOf('(');
			yearEnd = titleYear.lastIndexOf(')');
			var title = titleYear.substring(0, yearStart);
			var year = new String(titleNode.text()).match(/[0-9]{4}/gi)[0]; //titleNode.children('a:first').text();//titleYear.substring(yearStart+1, yearEnd);
			var mpaa_rating = new String($('div.infobar img:first').attr('alt')).replace('_','-');
			var mpaa_rating_explanation = new String($('[itemprop=contentRating]').text()).replace(/[\r\n]/gi,'');
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
			var writerNode = directorNode.parent().next()
			if (writerNode.children('h4:first').text().replace(/[\r\n\s]/gi,'') == 'Writers:') {
				writerNode.children('a').each(function (i, link) {
					if ($(link).attr('href') != 'fullcredits#writers'){
						writers.push($(link).text());
					}
				});
			}
			if (metaDescription.indexOf('With ') != -1) {
				var actorStart = metaDescription.indexOf('With ') + 5;
				var actorEnd = metaDescription.indexOf('.', actorStart);
				var actors = metaDescription.substring(actorStart, actorEnd);
			}
			var plot = new String($('p[itemprop=description]').text().replace(/[\r\n]/gi,'')).trim();
			var poster = $('img[itemprop=image]').attr('src');
			var poster_data = null;

			var uri = url;

			var model = {
					id: id
					,title: title
					,year: year
					,mpaa_rating: mpaa_rating
					,mpaa_rating_explanation: mpaa_rating_explanation
					,release_date: release_date
					,runtime: runtime
					,genre: genres.join(', ')
					,director: director
					,writer: writers.join(', ')
					,actors: actors
					,plot: plot
					,poster: poster
				};

			// if (self.req.query.embed_poster) {
			// 	request({uri: poster, encoding: 'binary'}, function(err, resp, body) {
			// 		if (!err && resp.statusCode == 200) {
			//         	poster_data = new Buffer(body.toString(), "binary").toString("base64");
			//         	model.poster_data = poster_data;
			//         	model.uri = url;
			//         	for (var prop in model) {
			//         		if ( typeof model[prop] == 'undefined' || model[prop] == 'undefined' || model[prop] == null || model[prop] == '' ) {
			// 					model[prop] = 'N/A';
			// 				}
			//         	}
			//         	redis.set(id, JSON.stringify(model));
			//         	redis.expire(id, 60);
			//         	return callback(null, model);
			//     	}
			// 	});
			// } else {
				model.uri = url;
				for (var prop in model) {
	        		if ( typeof model[prop] == 'undefined' || model[prop] == 'undefined' || model[prop] == null || model[prop] == '' ) {
						model[prop] = 'N/A';
					}
	        	}
				redis.set(id, JSON.stringify(model));
				redis.expire(id, 60);
				return callback(null, model);
			//}
		});
	}; //END function getResponse

	var _getResults = function(search, callback) {
		var search = escape(search);
		var url = util.format('http://www.imdb.com/find?s=tt&q=%s', search);
		request(url, function(err, resp, body) {

			$ = cheerio.load(body);
			if ($('title').text() != 'IMDb Title Search') {
				var uri = new String($('link[rel=canonical]').attr('href'));
				var titleId = uri.substring(uri.indexOf('/title/')+7, uri.lastIndexOf('/'));
				//self.res.redirect('/v1/titles/{id}'.expand({id:titleId}));
				return self.findById(titleId, callback);
			}

			var results = [];

			$('a').each(function(i,link) {
				var l = $(link);
				var year = 'N/A';
				var parentNodeText = new String(l.parent().text())
				if (parentNodeText.search(/[0-9]{4}/gi) !== -1) {
					year = parentNodeText.match(/[0-9]{4}/gi)[0];
				}
				if (new String(l.attr('href')).indexOf('/title/tt') != -1) {
					var href = l.attr('href');
					var titleId = href.substring(href.indexOf('/title/')+7, href.lastIndexOf('/'));
					var exists = false;
					var title = l.text().replace(/"/gi,'');
					for (i=0;i<results.length;i++) {
						exists = results[i].id == titleId;
						if (exists)
						{
							break;
						}
					}
					if (!exists && !String.isNullOrEmpty(title)) {
						results.push({
							id: titleId
							,title: title
							,year: year
							,uri: util.format('http://api.moviejs.com/v1/titles/%s/', titleId)
						});
					}
				}
			});
			redis.set(search, JSON.stringify(results));
			redis.expire(search, 60);
			return callback(null, results);
		});
	};

};

module.exports = new imdb();