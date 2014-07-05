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