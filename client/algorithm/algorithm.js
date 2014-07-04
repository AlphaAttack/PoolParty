var fs = require('fs');

var hashtype;

var joomla = require('./joomla.js');
var md5 = require('./md5.js');
var sha1 = require('./sha1.js');

exports.SetHashType = function(hashtype) {
	this.hashtype = hashtype;
}

exports.BruteforceSucceeded = function() {
	if (fs.existsSync("hashcat/decrypted.txt"))
	{
		switch (hashtype)
		{
			case 0:
				return md5.BruteforceSucceeded();
				break;
			case 11:
				return joomla.BruteforceSucceeded();
				break;
			case 100:
				return sha1.BruteforceSucceeded();
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
		switch (hashtype)
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