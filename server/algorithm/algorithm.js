var hashtype;

var joomla = require('./joomla.js');
var md5 = require('./md5.js');
var sha1 = require('./sha1.js');

exports.SetHashType = function(hashtype) {
	this.hashtype = hashtype;
}

exports.IsHashCorrect = function(hash) {
	switch (this.hashtype)
	{
		case 0:
			return md5.IsHashCorrect(hash);
			break;
		case 11:
			return joomla.IsHashCorrect(hash);
			break;
		case 100:
			return sha1.IsHashCorrect(hash);
			break;
		default:
			return false;
			break;
	}
}