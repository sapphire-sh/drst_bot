var fs = require('fs');

var cards = fs.readdirSync('data');

for(var i = 0; i < cards.length; ++i) {
	console.log('INSERT INTO `drst_bot` (`ds_filename`) VALUES (\'' + cards[i] + '\');');
}
