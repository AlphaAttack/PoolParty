var fs = require('fs');

exports.BruteforceSucceeded = function() {

	var file = fs.readFileSync("hashcat/decrypted.txt").toString().trim();

	var results = file.split('\n');

	if (results.length > 0)
	{
		if (results[results.length - 1].indexOf(currenthash.trim()) > -1)
			return true;
		else
			return false;
	}
	else
		return false;
}

exports.BruteforceResult = function() {
	var file = fs.readFileSync("hashcat/decrypted.txt").toString().trim();

	var results = file.split('\n');

	if (results.length > 0)
	{
		var result = results[results.length - 1].split(':')[2].split('\n')[0].trim();

		return result;
	}
}