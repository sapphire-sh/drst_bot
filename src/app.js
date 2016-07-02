'use strict';

const CONFIG = require('../config.js');

const _ = require('underscore');
const knex = require('knex')(CONFIG.knex);
const twit = new (require('twit'))(CONFIG.twitter);
const twit_sub = new (require('twit'))(CONFIG.twitter_sub);
const image = new (require('./lib/image'))();
const notify = new (require('./lib/notify'))(twit);
const user = new (require('./lib/user'))(twit, twit_sub);
const stream = new (require('./lib/stream'))(twit, twit_sub);
const card = new (require('./lib/card'))(knex);

let intv = setInterval(() => {
	if(_.keys(card).length !== 0 && _.keys(user.data).length !== 0) {
		stream.image = image;
		stream.card = card;
		stream.user = user;
		stream.startStream();
		
		clearInterval(intv);
	}
}, 100);
