'use strict';

const fs		= require('fs');	
const lwip		= require('lwip');

const OFFSET	= 12;
const IMG_SIZE	= 88 + OFFSET;

class Image {
	constructor() {
		
	}
	
	createImage(cards, callback) {
		if(cards.length === 1) {
			lwip.create(IMG_SIZE, IMG_SIZE, { a: 0, r: 0, g: 0, b: 0 }, function(err, image) {
				var filename = cards[0].ds_filename;
				lwip.open('data/' + filename, function(err, src) {
					image.paste(OFFSET / 2, OFFSET / 2, src, function(err, dst) {
						dst.toBuffer('png', function(err, buffer) {
							if(err) {
								console.log(err);
							}
							else {
								callback(buffer);
							}
						});
					});
				});
			});
		}
		else {
			var filenames = [];
			for(var i = 0; i < 10; ++i) {
				filenames.push(cards[i][0].ds_filename);
			}
			lwip.create(IMG_SIZE * 5, IMG_SIZE * 2, { a: 0, r: 0, g: 0, b: 0 }, function(err, image) {
				open(filenames, [], function(srcs) {
					paste(image, srcs, 0, 0, function(dst) {
						dst.toBuffer('png', function(err, buffer) {
							if(err) {
								console.log(err);
							}
							else {
								callback(buffer);
							}
						});
					});
				});
			});
		}
	}
}

function open(filenames, srcs, callback) {
	var filename = filenames.pop();
	if(filename === undefined) {
		callback(srcs);
	}
	else {
		lwip.open('data/' + filename, function(err, image) {
			srcs.push(image);

			open(filenames, srcs, callback);
		});
	}
}

function paste(dst, srcs, left, top, callback) {
	var src = srcs.pop();
	if(src === undefined) {
		callback(dst);
	}
	else {
		dst.paste(left + OFFSET / 2, top + OFFSET / 2, src, function(err, image) {
			paste(image, srcs, (left + IMG_SIZE) % (IMG_SIZE * 5), (left == IMG_SIZE * 4 ? IMG_SIZE : top), callback);
		});
	}
}


module.exports = Image;
