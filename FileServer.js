var http = require('http');
var fileSystem = require('fs');
var path = require('path');

http.createServer(function (req, res) {
	try {
		var filePath = path.join("." + req.url);
		console.log(filePath);
		res.writeHead(200, {
			'Content-Type': 'text-plain',
		})

		var content = fileSystem.readFileSync(filePath);
		res.end(content);
	}
	catch (err) {
		console.log(err.message);
	}

}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');