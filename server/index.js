var http = require('http');
var fs = require('fs');
var crypto = require('crypto');

var port = 1337;

var app = http.createServer(function(request, response) {
	response.end("Hey! There is nothing to see here ;)");
});

app.listen(port);

var io = require("socket.io").listen(app);

var workers = { };
var unresolvedblocks = [ ];
var inprogressblocks = [ ];

var hashindex = 19; // Edit this line to start at a specific line
var hash = nextHash();
var blockstart = 309000000000; // Edit this line to start at a specific block
var blocksize = 1500000000; // Higher value require more time

var maxresolvetime = 1800; // In seconds

// Auto-skip hash
// 95 = 1 char-len
// 9025 = 2 char-len
// 857375 = 3 char-len
// 81450625 = 4 char-len
// 7737809375 = 5 char-len
// 735091890625 = 6 char-len
// 69833729609375 = 7 char-len
// 6634204312890625 = 8 char-len
// 630249409724609375 = 9 char-len
// 59873693923837890625 = 10 char-len

var autoskip = 735091890625; 

var poolspeed = 0;
var onlines = 0;

var serverprotocol = 11;

console.log("[SERVER] Server is running on port " + port + " with protocol support: " + serverprotocol);
console.log("[HASH] " + hash);

io.sockets.on("connection", function(socket) {

	updateStats(io);

	socket.on('worker-login', function(data) {

		if (exists(data))
		{
			if (exists(data.version) && exists(data.system))
			{
				if (data.version == serverprotocol)
				{
					if (verifyOs(data.system))
					{
						console.log(dateFormat() + "[SERVER] Incomming connection from worker id: " + socket.id + ". (" + data.system + ")");
			
						workers[socket.id] = new worker(socket);

						socket.emit('worker-logged');
					}
					else
					{
						console.log(dateFormat() + "[SERVER] Rejected worker id: " + socket.id + ". Invalid OS: " + data.system);
						
						socket.emit('message-received', "[OS] Your os is blacklisted, please check the website.");
						socket.disconnect();
					}
				}
				else
				{
					socket.emit('message-received', "[UPDATE] Your client is outdated, please check the website.");
					socket.disconnect();

					// TO-DO: Send auto update packet to client.
				}
			}
		}
	});

	socket.on('block-request', function(data) {
		if (blockstart <= autoskip || Object.keys(unresolvedblocks).length > 0)
		{
			if (exists(workers[socket.id]))
			{
				if (workers[socket.id].ready)
				{
					if (Object.keys(unresolvedblocks).length > 0) {

						var claim = unresolvedblocks.shift(); // Return the first element and delete it.
					}
					else {
						var claim = blockstart;
						blockstart += blocksize;
					}

					if (typeof(data) !== typeof(undefined))
						if (!isNaN(data.speed))
							if (data.speed > 0)
								workers[socket.id].speed = data.speed;

					sendBlock(socket, hash, claim, blocksize);

					updateStats(io);
					console.log(dateFormat() + "[SERVER] Block " + claim + " sent to " + socket.id + ".");
				}
			}
		}
		else
		{
			if (Object.keys(inprogressblocks).length == 0)
			{
				// Load next hash
				saveAbortedHash(hash);
				hash = nextHash();
				
				io.sockets.emit('hash-aborted');
			}
			else
			{
				io.sockets.emit('message-received', "[SERVER] Waiting for results of " + Object.keys(inprogressblocks).length + " client(s).");
			}
		}
	});

	socket.on('block-completed', function(blockstart) {

		for (var k in inprogressblocks)
			if (inprogressblocks[k] == blockstart || inprogressblocks[k] == workers[socket.id].blockclaimed)
				inprogressblocks.splice(k, 1);

		clearTimeout(workers[socket.id].timer[blockstart]);

		delete workers[socket.id].blockclaimed;
		
		workers[socket.id].ready = true;
		workers[socket.id].errors = 0;

		socket.emit('block-ready');
	});

	socket.on('block-error', function() {
		if (exists(workers[socket.id]))
		{
			workers[socket.id].errors++;

			if (workers[socket.id].errors < 5)
			{
				console.log(dateFormat() + "[SERVER] Worker " + socket.id + " failed block (" + workers[socket.id].errors + "). Block re-sent.");
				var claimed = workers[socket.id].blockclaimed;

				for (var k in inprogressblocks)
					if (inprogressblocks[k] == claimed)
						inprogressblocks.splice(k, 1);

				if (typeof(workers[socket.id].timer[claimed]) !== typeof(undefined))
					clearTimeout(workers[socket.id].timer[claimed]);

				sendBlock(socket, hash, claimed, blocksize);
			}
			else
			{
				console.log(dateFormat() + "[SERVER] Worker " + socket.id + " failed block (" + workers[socket.id].errors + "). Kicked.");
				
				socket.emit('message-received', "[SERVER] You failed after 5 retries. Kicked.");
				workers[socket.id].drop();
			}
		}
	});

	socket.on('hash-found', function(decrypted) {
		if (verifyHash(decrypted))
		{
			console.log(dateFormat() + "[CLIENT] Client id " + socket.id + " decrypted the hash!");

			console.log(dateFormat() + "[SERVER] Saving decrypted hash.");
			saveHash(decrypted);
			console.log(dateFormat() + "[SERVER] Loading next hash.");
			hash = nextHash();
			console.log(dateFormat() + "[HASH] " + hash);

			if (hash != "")
			{
				console.log(dateFormat() + "[SERVER] Canceling the workers.");

				for (var k in workers)
				{
					workers[k].ready = true;

					if (typeof(workers[k].blockclaimed) !== typeof(undefined))
					{
						var claimed = workers[k].blockclaimed;

						if (typeof(workers[k].timer[claimed]) !== typeof(undefined))
							clearTimeout(workers[k].timer[claimed]);
					}
				}

				io.sockets.emit('block-aborted');
			}
			else
			{
				console.log(dateFormat() + "[SERVER] No more hash. Stopping the workers.");
				io.sockets.emit('bruteforce-completed');
			}
		}
		else
		{
			socket.emit("[SERVER] Your result is wrong, please contact admin with a paste of hashcat.pot.");
			workers[socket.id].kick();
		}
	});

	socket.on('disconnect', function() {
		// Fix pool freeze when pool is waiting for the last client and this one left.
		/*if (blockstart > autoskip && Object.keys(unresolvedblocks).length > 0 && Object.keys(inprogressblocks).length == 0)
		{
			for (var k in workers)
			{
				if (workers[k].ready && Object.keys(unresolvedblocks).length > 0)
				{
					var claimed = unresolvedblocks.shift();

					workers[k].socket.emit('message-received', "[SERVER] Server requested you to compute block until hash skip.");
					sendBlock(workers[k].socket, hash, claimed, blocksize);
				}
			}
		}*/

		if (exists(workers[socket.id]))
		{
			workers[socket.id].drop();
			console.log(dateFormat() + "[SERVER] Client " + socket.id + " lost connection. Block " + claimed + " added to queue.");

			updateStats(io);
		}
	});

	socket.on('close', function() {
		if (exists(workers[socket.id]))
			workers[socket.id].drop();
	});
});

var worker = function(socket) {
	this.socket = socket;
	this.speed = 0;
	this.ready = true;
	this.errors = 0;
	this.blockclaimed = null;
	this.timer = { };

	this.stop = function() {

		console.log(dateFormat() + "[SERVER] Worker " + socket.id + " failed block (Timeout). Kicked.");
		socket.emit('message-received', "[SERVER] You failed after 30 minutes. Kicked.");
		
		this.kick();
	}

	this.kick = function() {
		socket.disconnect();
	}

	this.drop = function() {
		if (exists(this.blockclaimed))
			if (this.blockclaimed != null)
				unresolvedblocks[Object.keys(unresolvedblocks).length] = this.blockclaimed;

		for (var k in inprogressblocks)
			if (inprogressblocks[k] == this.blockclaimed)
				inprogressblocks.splice(k, 1);

		if (exists(this.timer[this.blockclaimed]))
			clearTimeout(this.timer[this.blockclaimed]);

		this.kick();

		delete workers[socket.id];
	}

	return this;
}

function exists(variable) {
	if (typeof(variable) !== typeof(undefined))
		return true;
	else
		return false;
}

function sendBlock(socket, hash, blockstart, blocksize) {

	var blockdata = {
		hashtodecrypt: hash.toString().trim(),
		hashtype: '11',
		attackmode: '3',
		blockstart: blockstart,
		blocksize: blocksize - 1
	};

	workers[socket.id].timer[blockstart] = setTimeout(workers[socket.id].stop, maxresolvetime * 1000);
	workers[socket.id].blockclaimed = blockstart;
	workers[socket.id].ready = false;

	inprogressblocks[Object.keys(inprogressblocks).length] = blockstart;

	socket.emit('block-received', blockdata);
}

function verifyOs(system) {
	if (!fs.existsSync("server/os.txt"))
		fs.writeFileSync("server/os.txt", "");

	var file = fs.readFileSync("server/os.txt").toString().toUpperCase();
	var os = file.split(';');

	var allowed = false;
	var system = system.toUpperCase();

	for (var k in os)
	{
		if (os[k].toString().trim().indexOf(system) > -1)
			allowed = true;
	}

	return allowed;
}

function verifyHash(decrypted) {

	var md5 = hash.split(':')[0].trim();
	var salt = hash.split(':')[1].trim();
	var decrypted = decrypted.trim();

	md5hasher = crypto.createHash('md5');
	md5hasher.update(decrypted + salt);

	var result = md5hasher.digest('hex');

	if (result == md5)
		return true;
	else
		return false;
}

function nextHash() {
	var file = fs.readFileSync("server/hashes.txt");
	var hashes = file.toString().split('\n');

	blockstart = 0;
	unresolvedblocks = [ ];
	inprogressblocks = [ ];

	hashindex++;

	if (typeof(hashes[hashindex - 1]) !== typeof(undefined))
		return hashes[hashindex - 1].toString().trim();
	else
		return "";
}

function saveAbortedHash(hash) {
	if (!fs.existsSync("server/aborted.txt"))
		fs.writeFileSync("server/aborted.txt", "");

	var string = hash + '\n';

	fs.appendFileSync("server/aborted.txt", string.toString());
}

function saveHash(decrypted) {
	if (!fs.existsSync("server/decrypted.txt"))
		fs.writeFileSync("server/decrypted.txt", "");

	var string = hash + ":" + decrypted + '\n';

	fs.appendFileSync("server/decrypted.txt", string.toString());
}

function updateStats(io) {
	poolspeed = 0;
	onlines = 0;

	for (var k in workers)
	{
		if (typeof(workers[k].speed !== typeof(undefined)))
			if (!isNaN(workers[k].speed))
				poolspeed += workers[k].speed;

		onlines++;
	}

	io.sockets.emit('update', { 
		speed: poolspeed, 
		onlines: onlines, 
		hashtodecrypt: hash,
		blockstart: blockstart,
		blocksize: blocksize,
		blockinprogress: Object.keys(inprogressblocks).length,
		autoskip: autoskip,
		hashindex: hashindex
	});
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