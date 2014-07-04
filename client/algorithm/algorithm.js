var fs = require('fs');

var hashtype;

var joomla = require('./joomla.js');

exports.SetHashType = function(hashtype) {
	this.hashtype = hashtype;
}

exports.BruteforceSucceeded = function() {
	if (fs.existsSync("hashcat/decrypted.txt"))
	{
		switch (hashtype)
		{
			case 11:
				return joomla.BruteforceSucceeded();
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
			case 11:
				return joomla.BruteforceResult();
				break;
		}
	}
	else
	{
		return null;
	}
}