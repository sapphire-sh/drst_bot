'use strict';

let path = require('path');

const config = require('../../config');

let knex = require('knex')(config.knex);

const lwip = require('lwip');

const offset = 12;
const img_size = 88 + offset;

const img_dir = path.join(__dirname, '..', '..', 'data');

const table_name = 'drst_bot';

const ssr_rate = 0.015;
const sr_rate = 0.10;

class Card {
	initialize() {
		var self = this;
		
		self.cards = {
			ssr: [],
			sr: [],
			r: []
		};
		
		return new Promise((resolve, reject) => {
			return knex(table_name).where('multiplier', '!=', 0).then((rows) => {
				rows.forEach((row) => {
					Array.from(Array(row.multiplier)).forEach(() => {
						self.cards[row.rarity].push(row);
					});
				});
				knex.destroy();
				resolve();
			}).catch((e) => {
				console.log(e);
			});
		});
	}
	
	_pickCard(isSR) {
		let self = this;
		
		return new Promise((resolve, reject) => {
			let rarity = Math.random();
			
			if(isSR) {
				if(rarity < ssr_rate) {
					resolve(self.cards.ssr[parseInt(Math.random() * self.cards.ssr.length)]);
				}
				else {
					resolve(self.cards.sr[parseInt(Math.random() * self.cards.sr.length)]);
				}
			}
			else {
				let rarity = Math.random();
				if(rarity < ssr_rate) {
					resolve(self.cards.ssr[parseInt(Math.random() * self.cards.ssr.length)]);
				}
				else if(rarity < ssr_rate + sr_rate) {
					resolve(self.cards.sr[parseInt(Math.random() * self.cards.sr.length)]);
				}
				else {
					resolve(self.cards.r[parseInt(Math.random() * self.cards.r.length)]);
				}
			}
		});
	}
	
	pickSingleCard() {
		var self = this;
		
		return new Promise((resolve, reject) => {
			self._pickCard().then((card) => {
				resolve([card]);
			});
		});
	}
	
	pickMultipleCards() {
		var self = this;
		
		return new Promise((resolve, reject) => {
			let promises = Array.from(Array(10)).map((e, i) => {
				if(i === 9) {
					return self._pickCard(true);
				}
				else {
					return self._pickCard();
				}
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
			
			lwip.create(width, height, {
				a: 1,
				r: 1,
				g: 1,
				b: 1
			}, (err, image) => {
				cards.reduce((promise, card, i) => {
					return promise.then((image) => {
						return new Promise((resolve, reject) => {
							let filename = card.filename;
							let offset_width = (i % 5) * img_size;
							let offset_height = (i < 5 ? 0 : img_size);
							lwip.open(path.join(img_dir, filename), (err, src) => {
								image.paste(offset_width + offset / 2, offset_height + offset / 2, src, (err, dst) => {
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
					dst.toBuffer('png', function(err, buffer) {
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

