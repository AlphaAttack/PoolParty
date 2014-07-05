var crypto = require('crypto');

exports.IsHashCorrect = function(hash) {
	var hash = hash;

	if (hash.indexOf(" ") == -1)
	{
		var parts = hash.split(':');

		if (parts[0].match(new RegExp("[0-9abcdefABCDEF]", "g")))
		{
			if (parts[0].length == 32 && parts[1].length == 32)
				return true
			else
				return false;
		}
		else
			return false;
	}
	else
		return false;
}

exports.IsResultCorrect = function(currenthash, result) {
	var md5 = currenthash.split(':')[0];
	var salt = currenthash.split(':')[1];
	var result = result;

	md5crypto = crypto.createHash('md5');
	md5crypto.update(result + salt);

	var computed = md5crypto.digest('hex');

	if (computed == md5)
		return true;
	else
		return false;
}