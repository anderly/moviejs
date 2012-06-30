var request = require('request');
var cheerio = require('cheerio');
var util = require('util');
var rtg   = require('url').parse('redis://redistogo:11057819af4dd82422458a5fb4803b4b@koi.redistogo.com:9484/');
var redis = require('redis').createClient(rtg.port, rtg.hostname);
var redisAuth = redis.auth(rtg.auth.split(':')[1]);
redis.on("error", function (err) {
    console.log("Error " + err);
});

module.exports = {

	findById: function(req, callback) {
		this._getCacheWithDefault(req,callback);
	}

	,findByUrl: function(req, callback) {

	}

	,_getCacheWithDefault: function(req, callback) {
		var id = req.params.id;
		var self = this;
		//if (typeof redisAuth != 'undefined') {
			redis.get(id, function (err, reply) {
		        if (reply!='null' && reply!=null && !req.query.nocache) {
		        	console.log(util.format('%s found in cache', id));
		        	/*var model = JSON.parse(reply);
		        	for (var prop in model) {
		        		if ( typeof model[prop] == 'undefined' || model[prop] == 'undefined' || model[prop] == null || model[prop] == '' ) {
							model[prop] = 'N/A';
						}
		        	}*/
		        	redis.expire(id, 60);
		        	callback(reply);
		        } else {
		        	self._getResponse(req, callback);
		        }
		        //redis.quit();
		    });
		//} else {
		//	this._getResponse(req, callback);
		//}
	} //END function getCacheWithDefault

	,_getResponse: function(req, callback) {
		var id = req.params.id;
		console.log(util.format('%s not found in cache', id));
		var url = util.format('http://www.imdb.com/title/%s/', id);

		request(url, function(err, resp, body){
			$ = cheerio.load(body);

			var titleNode = $('h1[itemprop=name]');
			var titleYear = new String(titleNode.text()).replace(/[\r\n]/gi,'');//new String($('meta[property="og:title"]').attr('content')).replace(/[\r\n\(\)]/gi,'');
			yearStart = titleYear.indexOf('(');
			yearEnd = titleYear.lastIndexOf(')');
			var title = titleYear.substring(0, yearStart);
			var year = new String(titleNode.text()).match(/[0-9]{4}/gi)[0]; //titleNode.children('a:first').text();//titleYear.substring(yearStart+1, yearEnd);
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
			        	poster_data = new Buffer(body.toString(), "binary").toString("base64");
			        	model.poster_data = poster_data;
			        	model.uri = url;
			        	for (var prop in model) {
			        		if ( typeof model[prop] == 'undefined' || model[prop] == 'undefined' || model[prop] == null || model[prop] == '' ) {
								model[prop] = 'N/A';
							}
			        	}
			        	redis.set(id, JSON.stringify(model));
			        	redis.expire(id, 60);
			        	callback(model);
			    	}
				});
			} else {
				model.uri = url;
				for (var prop in model) {
	        		if ( typeof model[prop] == 'undefined' || model[prop] == 'undefined' || model[prop] == null || model[prop] == '' ) {
						model[prop] = 'N/A';
					}
	        	}
				redis.set(id, JSON.stringify(model));
				redis.expire(id, 60);
				callback(model);
			}
		});
	} //END function getResponse

}