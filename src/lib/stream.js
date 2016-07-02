'use strict';

const _ = require('underscore');

const REGEX_MULTI = /가챠|뽑기|gacha|gasha|가샤|ガシャ|がしゃ|ガチャ|がちゃ/;
const REGEX_SINGLE = /단챠|単発/;

class Stream {
	constructor(twit, twit_sub) {
		let self = this;
		self.twit = twit;
		self.twit_sub = twit_sub;
	}
	
	startStream() {
		let self = this;
		
		let stream = self.twit.stream('user');
		let stream_sub = self.twit_sub.stream('user');
		
		stream.on('follow', (data) => {
			if(data.event === 'follow' && data.source.screen_name !== 'drst_bot') {
				self.twit.post('friendships/create', {
					user_id: data.source.id_str
				}, (err, res) => {
					if(err) {
						console.log(err);
					}
				});
			}
		});
		
		stream.on('tweet', (data) => {
			if(!data.retweeted_status && !self.user.limit) {
				let flag = _.some(data.entities.user_mentions, (user) => {
					return user.screen_name === 'drst_bot';
				});
				
				if(flag) {
					let text = data.text.toLowerCase();
					if(text.match(REGEX_MULTI)) {
						self._replyMultiple(data);
					}
					else if(text.match(REGEX_SINGLE)) {
						self._replySingle(data);
					}
				}
			}
		});
		
		stream_sub.on('tweet', (data) => {
			if(!data.retweeted_status && !self.user.limit) {
				let flag = _.some(data.entities.user_mentions, (user) => {
					return user.screen_name === 'drst_bot_1';
				});
				flag &= _.every(data.entities.user_mentions, (user) => {
					return user.screen_name !== 'drst_bot';
				});
				
				if(flag) {
					let text = data.text.toLowerCase();
					if(text.match(REGEX_MULTI)) {
						self._replyMultiple(data);
					}
					else if(text.match(REGEX_SINGLE)) {
						self._replySingle(data);
					}
				}
			}
		});
	}
	
	_replyMultiple(data) {
		let self = this;
		
		let cards = self.card.pickMultipleCards();
		
		self.image.createImage(cards, (buffer) => {
			var str = '@' + data.user.screen_name + '\n';
			for(var i = 0; i < 10; ++i) {
				str += cards[i].rarity.toUpperCase() + ' ' + cards[i].name + '\n';
			}
			self._tweet(str, data.id_str, buffer);
		});
	}
	
	_replySingle(data) {
		var self = this;
		
		let card = self.card.pickSingleCard();
		
		self.image.createImage(card, (buffer) => {
			var str = '@' + data.user.screen_name + '\n';
			str += card.rarity.toUpperCase() + ' ' + card.name + '\n';
			
			self._tweet(str, data.id_str, buffer);
		});
	}
	
	_tweet(status, in_reply_to, buffer) {
		var self = this;
		
		self.twit.post('media/upload', {
			media_data: buffer.toString('base64')
		}, function(err, res) {
			if(err) {
				console.log(err);
			}
			self.twit.post('statuses/update', {
				status: status,
				in_reply_to_status_id: in_reply_to,
				media_ids: res.media_id_string
			}, function(err, res) {
				if(err) {
					if(err.code === 185) {
						self._tweet_sub(status, in_reply_to, buffer);
					}
					else {
						console.log(err);
					}
				}
			});
		});
	}
	
	_tweet_sub(status, in_reply_to, buffer) {
		var self = this;
		
		self.twit_sub.post('media/upload', {
			media_data: buffer.toString('base64')
		}, function(err, res) {
			if(err) {
				console.log(err);
			}
			self.twit_sub.post('statuses/update', {
				status: status,
				in_reply_to_status_id: in_reply_to,
				media_ids: res.media_id_string
			}, function(err, res) {
				if(err) {
					if(err.code === 185) {
					//	self.user.setLimit();
					}
					else {
						console.log(err);
					}
				}
			});
		});
	}
}


module.exports = Stream;
