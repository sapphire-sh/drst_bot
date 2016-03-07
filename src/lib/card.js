'use strict';

const fs = require('fs');
const _ = require('underscore');

const SSR_RATE = 0.015;
const SR_RATE = 0.10;

class Card {
	constructor(knex) {
		let self = this;
		self.knex = knex;
		self.data = {};
		
		self._initialize();
	}
	
	_initialize() {
		var self = this;
		
		self.knex('drst_bot')
		.where('ds_multiplier', '!=', 0)
		.then((rows) => {
			let cards = [];
			_.each(rows, function(row) {
				let count = row.ds_multiplier;
				while(count > 0) {
					cards.push({
						name: row.ds_name,
						rarity: row.ds_rarity,
						filename: row.ds_filename,
						multiplier: row.ds_multiplier
					});
					--count;
				}
			});
			self.data = _.groupBy(cards, function(card) {
				return card.rarity;
			});
		})
		.catch(function(err) {
			console.log(err);
		})
		.finally(function() {
		    self.knex.destroy();
		});
	}
	
	_pickCard(isSR) {
		let self = this;
		
		isSR = isSR === undefined ? false : isSR;
		
		if(isSR) {
			return _.sample(self.data.sr, 1)[0];
		}
		else {
			let r = Math.random();
			if(r < SSR_RATE) {
				return _.sample(self.data.ssr, 1)[0];
			}
			r = Math.random();
			if(r < SR_RATE) {
				return _.sample(self.data.sr, 1)[0];
			}
			return _.sample(self.data.r, 1)[0];
		}
	}
	
	pickSingleCard() {
		var self = this;
		
		return self._pickCard();
	}
	
	pickMultipleCards() {
		var self = this;
		
		let cards = [];
		_(10).times((i) => {
			var card = self._pickCard();
			if(i === 9 && card.rarity === 'r') {
				card = self._pickCard(true);
			}
			cards.push(card);
		});
		
		return cards;
	}
}

module.exports = Card;
