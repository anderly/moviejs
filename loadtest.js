var nl = require('nodeload');

nl.run({
    name: "Read",
    host: 'api.moviejs.com',
    port: 80,
    numUsers: 10,
    timeLimit: 600,
    targetRps: 500,
    stats: [
        'result-codes', 
        { name: 'latency', percentiles: [0.9, 0.99] },
        'concurrency',
        'rps',
        'uniques',
        { name: 'http-errors', successCodes: [200,404], log: 'http-errors.log' }
    ],
    requestGenerator: function(client) {
        //client.port = 5000;
        return client.request('GET', "/v1/titles/tt1345836/", { 'host': 'api.moviejs.com' });
    }
});