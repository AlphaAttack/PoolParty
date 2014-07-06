var hashtype;

var joomla = require('./joomla.js');
var md5 = require('./md5.js');
var sha1 = require('./sha1.js');
var sha256 = require('./sha256.js');
var sha512 = require('./sha512.js');

exports.SetHashType = function(hashtype) {
	this.hashtype = hashtype;
}

exports.SetHash = function(currenthash) {
	this.currenthash = currenthash;
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
		case 1400:
			return sha256.IsHashCorrect(hash);
			break;
		case 1700:
			return sha512.IsHashCorrect(hash);
			break;
		default:
			return false;
			break;
	}
}

exports.IsResultCorrect = function(result) {
	switch (this.hashtype)
	{
		case 0:
			return md5.IsResultCorrect(this.currenthash, result);
			break;
		case 11:
			return joomla.IsResultCorrect(this.currenthash, result);
			break;
		case 100:
			return sha1.IsResultCorrect(this.currenthash, result);
			break;
		case 1400:
			return sha256.IsResultCorrect(this.currenthash, result);
			break;
		case 1700:
			return sha512.IsResultCorrect(this.currenthash, result);
			break;
		default:
			return false;
			break;
	}
}