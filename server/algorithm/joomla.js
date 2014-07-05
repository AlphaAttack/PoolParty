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