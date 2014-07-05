var crypto = require('crypto');

exports.IsHashCorrect = function(hash) {
	var hash = hash;

	if (hash.indexOf(" ") == -1)
	{
		if (hash.match(new RegExp("[0-9abcdefABCDEF]", "g")))
		{
			if (hash.length == 40)
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
	var sha1 = currenthash;
	var result = result;

	sha1crypto = crypto.createHash('sha1');
	sha1crypto.update(result);

	var computed = sha1crypto.digest('hex');

	if (computed == sha1)
		return true;
	else
		return false;
}