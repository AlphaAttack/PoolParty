var crypto = require('crypto');

exports.IsHashCorrect = function(hash) {
	var hash = hash;

	if (hash.indexOf(" ") == -1)
	{
		if (hash.match(new RegExp("[0-9abcdefABCDEF]", "g")))
		{
			if (hash.length == 64)
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
	var sha256 = currenthash;
	var result = result;

	sha256crypto = crypto.createHash('sha256');
	sha256crypto.update(result);

	var computed = sha256crypto.digest('hex');

	if (computed == sha256)
		return true;
	else
		return false;
}