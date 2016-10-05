'use strict';

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

