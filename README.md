# MovieJS

## Summary

IMDB is great for looking up movie information (plot, director, actors, rating, etc.), but it currently has no public API. During a recent project for several theater chains, I needed to be able to pull in movie information from IMDB and I already had the IMDB title IDs.

Hence, MovieJS was born to provide a fast, simple IMDB-backed API supporting movie-lookup by IMDB title id as well as some search scenarios.

We leverage cheerio (the excellent jquery-esque node module) for some nice server-side dom loading and parsing and then resort to regex where we have to.

We do not replicate/persist IMDB data but instead simply cache API query results in Redis using a sliding expiration to avoid uncessary overhead calling IMDB.