'use strict';

const CONFIG	= require('../config.js');

const _			= require('underscore');
const knex		= require('knex')(CONFIG.knex);
const twit		= new (require('twit'))(CONFIG.twitter);

const image		= new (require('./lib/image'))();
const notify	= new (require('./lib/notify'))(twit);
const user		= new (require('./lib/user'))(twit);
const stream	= new (require('./lib/stream'))(twit);
const card		= new (require('./lib/card'))(knex);

let intv = setInterval(() => {
	if(_.keys(card).length !== 0 && _.keys(user.data).length !== 0) {
		stream.image	= image;
		stream.card		= card;
		stream.user		= user;
		stream.startStream();
		
		clearInterval(intv);
	}
}, 100);
