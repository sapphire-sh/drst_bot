'use strict';

const config = require('../config.js');

let knex = require('knex')(config.knex);
let twit = new (require('twit'))(config.twitter);
let twit_sub = new (require('twit'))(config.twitter_sub);

let Card = new require('./lib/card');
let Twitter = new require('./lib/twitter');

class App {
	constructor() {
		let self = this;
		
		self.card = new Card();
		self.card.initialize().then(() => {
			self.twitter = new Twitter();
			return self.twitter.initialize(self.card);
		}).then(() => {
			if(process.env.NODE_ENV !== 'test') {
				self.twitter.startStream();
				self.twitter.startScheduler();
			}
		}).catch((e) => {
			console.log(e);
		});
	}
}

if(process.env.NODE_ENV !== 'test') {
	let app = new App();
}

module.exports = App;

