'use strict';

let path = require('path');

const jimp = require('jimp');
const Horseman = require('node-horseman');
const cheerio = require('cheerio');

const offset = 12;
const img_size = 88 + offset;

const img_dir = path.join(__dirname, '../../data');

class Card {
	initialize() {
		var self = this;

		return Promise.resolve();
	}

	_pickCard(data) {
		let self = this;

		return new Promise((resolve, reject) => {
			const horseman = new Horseman();
			horseman
				.open(`https://mobile.twitter.com/${data.user.screen_name}/following`)
				.html()
				.then((content) => {
					let $ = cheerio.load(content);

					let k = [];

					$('img').each((i, e) => {
						if($(e).attr('src').match(/profile_images/)) {
							k.push($(e).attr('src').replace(/_normal/g, ''));
						}
					});

					resolve(k[Math.floor(Math.random() * k.length)]);
				}).close();
		});
	}

	pickSingleCard(data) {
		var self = this;

		return new Promise((resolve, reject) => {
			self._pickCard(data).then((card) => {
				resolve([card]);
			});
		});
	}

	pickMultipleCards(data) {
		var self = this;

		return new Promise((resolve, reject) => {
			let promises = Array.from(Array(10)).map((e, i) => {
				return self._pickCard(data);
			});
			Promise.all(promises).then((res) => {
				resolve(res);
			}).catch((e) => {
				console.log(e);
			});
		});
	}

	createImage(cards) {
		let self = this;

		return new Promise((resolve, reject) => {
			let width = img_size * (cards.length === 1 ? 1 : 5);
			let height = img_size * (cards.length === 1 ? 1 : 2);

			new jimp(width, height, (err, image) => {
				cards.reduce((promise, card, i) => {
					return promise.then((image) => {
						return new Promise((resolve, reject) => {
							let offset_width = (i % 5) * img_size;
							let offset_height = (i < 5 ? 0 : img_size);
							jimp.read(card, (err, src) => {
								image.blit(src.resize(88, 88), offset_width + offset / 2, offset_height + offset / 2, (err, dst) => {
									if(err) {
										throw new Error(err);
									}
									else {
										resolve(dst);
									}
								});
							});
						});
					});
				}, Promise.resolve(image)).then((dst) => {
					dst.getBuffer(jimp.MIME_PNG, function(err, buffer) {
						if(err) {
							throw new Error(err);
						}
						resolve(buffer);
					});
				}).catch((e) => {
					console.log(e);
				});
			});
		});
	}
}

module.exports = Card;
