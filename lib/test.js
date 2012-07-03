var request = require('request');
console.log('launched from Sublime Text');

request("http://api.moviejs.com/v1/titles/tt2215719/", function(err, resp, body){
	console.log(body);
});