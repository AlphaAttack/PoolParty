var crypto = require('crypto');

exports.IsHashCorrect = function(hash) {
	var hash = hash;

	if (hash.indexOf(" ") == -1)
	{
		if (hash.match(new RegExp("[0-9abcdefABCDEF]", "g")))
		{
			if (hash.length == 32)
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
	var md5 = currenthash;
	var result = result;

	md5crypto = crypto.createHash('md5');
	md5crypto.update(result);

	var computed = md5crypto.digest('hex');

	if (computed == md5)
		return true;
	else
		return false;
}