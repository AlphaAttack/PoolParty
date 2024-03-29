// Settings
var ip = '127.0.0.1'; // IP of pool
var port = '1337'; // Port of pool

var exec = require('child_process').exec;
var io = require('socket.io-client')('http://' + ip + ':' + port);
var fs = require('fs');
var os = require('os');

var algorithm = require('./algorithm/algorithm.js');

var child;

var currenthash;
var speed = 0;
var isbruteforcing = false;

var system = os.type();

var version = 13;

io.on('connect', function(socket) {
	console.log(dateFormat() + "[CLIENT] Connected to pool.");
	console.log(dateFormat() + "[CLIENT] Logging in.");
	
	io.emit('worker-login', {
		system: system,
		version: version
	});

	io.on('worker-logged', function() {
		console.log(dateFormat() + "[CLIENT] Requesting block from pool.");
		io.emit('block-request');
	});

	io.on('block-received', function(blockdata) {
		console.log(dateFormat() + "[CLIENT] Block received.");

		if (currenthash != blockdata.hashtodecrypt)
			console.log(dateFormat() + "[HASH] " + blockdata.hashtodecrypt);

		currenthash = blockdata.hashtodecrypt;

		var hash = blockdata.hashtodecrypt;
		var hashtype = blockdata.hashtype;
		var blockstart = blockdata.blockstart;
		var blocksize = blockdata.blocksize;

		algorithm.SetHashType(hashtype);
		algorithm.SetHash(hash);

		if (fs.existsSync("hashcat/decrypted.txt"))
			fs.unlinkSync("hashcat/decrypted.txt");

		if (fs.existsSync("hashcat/hash.txt"))
			fs.unlinkSync("hashcat/hash.txt");

		fs.writeFileSync("hashcat/hash.txt", hash);

		if (fs.existsSync("hashcat/hashcat-cli32.exe") && fs.existsSync("hashcat/hashcat-cli64.exe") && fs.existsSync("hashcat/hashcat-cli32.bin") && fs.existsSync("hashcat/hashcat-cli64.bin") && fs.existsSync("hashcat/hashcat-cli64.app"))
		{
			var command = '"hashcat/hashcat-cli64.exe" -m ' + hashtype + ' -a 3 -s ' + blockstart + ' -l ' + blocksize + ' -o "hashcat/decrypted.txt" "hashcat/hash.txt" ?a?a?a?a?a?a?a?a?a?a?a?a?a';

			var fail = false;

			if (!isbruteforcing)
			{
				console.log(dateFormat() + "[CLIENT] Started bruteforcing process.");
				
				isbruteforcing = true;

				hashcat = exec(command, function(error, stdout, stderr) { 
					if (error === null && stderr == "")
					{
							speed = parseSpeed(stdout);

							if (stdout.indexOf("Started:") == -1 || stdout.indexOf("Stopped:") == -1)
								fail = true;
					}
					else
						fail = true;
				});

				hashcat.on('close', function(code) {
					if (!fail)
					{
						if (!algorithm.BruteforceSucceeded())
						{
							console.log(dateFormat() + "[CLIENT] No hash discovered, requesting block from pool.");

							io.emit('block-completed', blockstart);
						}
						else
						{
							var result = algorithm.BruteforceResult();

							console.log(dateFormat() + "[CLIENT] Hash discovered: " + result + ".");
							
							io.emit('hash-found', result);
						}
					}
					else
					{
						console.log(dateFormat() + "[CLIENT] Error while computing the block.");
						io.emit('block-error');
					}

					isbruteforcing = false;
				});
			}
		}
		else
		{
			console.log(dateFormat() + "[CLIENT] Cannot bruteforce block, hashcat is missing.");
		}
	});

	io.on('block-ready', function() {
		io.emit('block-request', { speed: speed });
	});

	io.on('block-aborted', function() {
		console.log(dateFormat() + "[CLIENT] Pool stopped the workers (Someone decrypted the hash).");

		io.emit('block-request');
	});

	io.on('hash-aborted', function() {
		console.log(dateFormat() + "[CLIENT] Pool stopped the workers (Hash is too hard).");

		io.emit('block-request');
	});

	io.on('message-received', function(message) {
		console.log(dateFormat() + message);
	});

	io.on('bruteforce-completed', function() {
		console.log(dateFormat() + "[CLIENT] All hashes had been discovered.");
	});

	io.on('disconnect', function(){
		console.log(dateFormat() + "[CLIENT] Connection lost with pool. (Auto-reconnection is disabled by the server).");
		io.disconnect();
		io.destroy();
	});
});

function parseSpeed(string) {

	var speed;
	var realspeed;

	speed = string.substring(string.indexOf("plains,") + 8, string.length);
	speed = speed.substring(0, speed.indexOf(" words"));
	
	realspeed = parseFloat(speed.trim());

	if (speed.indexOf("k") > -1)
		realspeed = realspeed * 1000;
	else if (speed.indexOf("M") > -1)
		realspeed = realspeed * 1000000;
	else if (speed.indexOf("G") > -1)
		realspeed = realspeed * 1000000000;

	if (!isNaN(realspeed))
	{
		return realspeed;
	}
	else
		return 0;
}

function dateFormat() {
	var date = new Date();

	var year = date.getFullYear();
	var month = (date.getMonth() < 10) ? "0" + date.getMonth() : date.getMonth();
	var day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate();
	var hours = (date.getHours() < 10) ? "0" + date.getHours() : date.getHours();
	var minutes = (date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes();
	var seconds = (date.getSeconds() < 10) ? "0" + date.getSeconds() : date.getSeconds();

	return "[" + month + "-" + day + "-" + year + " " + hours + ":" + minutes + ":" + seconds + "]";
}