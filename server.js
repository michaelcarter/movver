var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic('demo')).listen(8080);