var http = require('http');
var fileSystem = require('fs');
var path = require('path');
var exec = require('child_process').exec,
		child;

http.createServer(function (req, res) {
	try {
		console.log("req = '" + req.url + "'");
		
		//run commands and return the result
		if (runCommand("tool_routes_from_country", req, res)) return;
		if (runCommand("tool_get_airports_from_distance", req, res)) return;
		if (runCommand("tool_routes_from_airport", req, res)) return;

		//return the file requested
		var filePath = path.join("." + req.url);
		console.log(filePath);
		res.writeHead(200, {
			'Content-Type': 'text-plain',
		});

		var content = fileSystem.readFileSync(filePath);
		res.end(content);
	}
	catch (err) {
		console.log(err.message);
	}

}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
function runCommand(command, req, res) {
	var pos = req.url.search(command);
	if (pos != 1) return false;

	var cmd = "./" + command + " " + req.url.substring(command.length + 2, req.url.length);
	console.log("cmd = " + cmd);
	child = exec(cmd, function(error, stdout, stderr) {
		if (error !== null)
				console.log('exec error: ' + error);

			res.writeHead(200, {
			'Content-Type': 'text-plain',
		})
		res.end(stdout);
	}); 

	return true;
}
///////////////////////////////////////////////////////////////////////////////////////////////
