var crypto = require('crypto');

exports.IsHashCorrect = function(hash) {
	var hash = hash;

	if (hash.indexOf(" ") == -1)
	{
		if (hash.match(new RegExp("[0-9abcdefABCDEF]", "g")))
		{
			if (hash.length == 128)
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
	var sha512 = currenthash;
	var result = result;

	sha512crypto = crypto.createHash('sha512');
	sha512crypto.update(result);

	var computed = sha512crypto.digest('hex');

	if (computed == sha512)
		return true;
	else
		return false;
}