
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'MovieJS (Beta)', year: new Date().getFullYear() })
};