'use strict';

var assert = require('assert');

var App = require('../src/app');
var app = new App();

describe('@drst_bot', function() {
	it('pick single card', function(done) {
		app.card.pickSingleCard().then((cards) => {
			assert.equal(cards.length, 1);
			done();
		});
	});
	
	it('pick multiple cards', function(done) {
		app.card.pickMultipleCards().then((cards) => {
			assert.equal(cards.length, 10);
			done();
		});
	});
	
	it('create image from single card', function(done) {
		app.card.pickSingleCard().then((cards) => {
			return app.card.createImage(cards);
		}).then(() => {
			done();
		});
	});
	
	it('create image from multiple cards', function(done) {
		app.card.pickMultipleCards().then((cards) => {
			return app.card.createImage(cards);
		}).then(() => {
			done();
		});
	});
});

