# MovieJS

## Summary

[IMDB][0] is great for looking up movie information (plot, director, actors, rating, etc.), but it currently has no public API. During a recent project for several theater chains, I needed to be able to pull in movie information from IMDB and I already had the IMDB title IDs.

Hence, MovieJS was born to provide a fast, simple IMDB-backed API supporting movie-lookup by IMDB title id as well as some search scenarios.

We leverage [cheerio][1] (the excellent jQuery-esque node module) for some nice server-side dom loading and parsing and then resort to regex where we have to.

We do not replicate/persist IMDB data but instead simply cache API query results in Redis using a sliding expiration to avoid uncessary overhead calling IMDB.

### Base Uri

- http://api.moviejs.com

### Resources

- Titles: /v1/titles/:id (where id is IMDB title id) example: [The Dark Knight Rises][2]
- Titles (search):
/v1/titles/?search=:term (where term is a keyword or phrase) example: [Search for "katy perry"][3]

### Disclaimer

This is very much a work in progress and I'm considering adding other movie-info sources (other than IMDB) should the need or demand arise.

[0]:http://www.imdb.com
[1]:https://github.com/MatthewMueller/cheerio
[2]:http://api.moviejs.com/v1/titles/tt1345836
[3]:http://api.moviejs.com/v1/titles/?search=katy+perry