'use strict';

const fs = require('fs');	

const _ = require('underscore');
const lwip = require('lwip');

const OFFSET = 12;
const IMG_SIZE = 88 + OFFSET;

class Image {
	createImage(cards, callback) {
		let width = IMG_SIZE * (cards instanceof Array ? 5 : 1);
		let height = IMG_SIZE * (cards instanceof Array ? 2 : 1);
		if(!(cards instanceof Array)) {
			cards = [cards];
		}
		lwip.create(width, height, {
			a: 0,
			r: 0,
			g: 0,
			b: 0
		}, (err, image) => {
			_.reduce(cards, (promise, card, i) => {
				return promise.then((image1) => {
					return new Promise((resolve, reject) => {
						let filename = card.filename;
						let offset_width = (i % 5) * IMG_SIZE;
						let offset_height = (i < 5 ? 0 : IMG_SIZE);
						lwip.open(__dirname + '/../../data/' + filename, (err, src) => {
							image1.paste(offset_width + OFFSET / 2, offset_height + OFFSET / 2, src, (err, dst) => {
								if(err) {
									reject();
								}
								else {
									resolve(dst);
								}
							});
						});
					});
				});
			}, Promise.resolve(image))
			.then((dst) => {
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
	}
}

module.exports = Image;
