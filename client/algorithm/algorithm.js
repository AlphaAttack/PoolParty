var fs = require('fs');

var hashtype;
var currenthash;

var joomla = require('./joomla.js');
var md5 = require('./md5.js');
var sha1 = require('./sha1.js');

exports.SetHashType = function(hashtype) {
	this.hashtype = hashtype;
}

exports.SetHash = function(currenthash) {
	this.currenthash = currenthash;
}

exports.BruteforceSucceeded = function() {
	if (fs.existsSync("hashcat/decrypted.txt"))
	{
		switch (this.hashtype)
		{
			case 0:
				return md5.BruteforceSucceeded(this.currenthash);
				break;
			case 11:
				return joomla.BruteforceSucceeded(this.currenthash);
				break;
			case 100:
				return sha1.BruteforceSucceeded(this.currenthash);
				break;
		}
	}
	else
	{
		return false;
	}
}

exports.BruteforceResult = function() {
	if (fs.existsSync("hashcat/decrypted.txt"))
	{
		switch (this.hashtype)
		{
			case 0:
				return md5.BruteforceResult();
				break;
			case 11:
				return joomla.BruteforceResult();
				break;
			case 100:
				return sha1.BruteforceResult();
				break;
		}
	}
	else
	{
		return null;
	}
}