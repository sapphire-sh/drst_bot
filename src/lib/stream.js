'use strict';

const _				= require('underscore');

const REGEX_MULTI	= /가챠|뽑기|gacha|gasha|가샤|ガシャ|がしゃ|ガチャ|がちゃ/;
const REGEX_SINGLE	= /단챠/;

class Stream {
	constructor(twit) {
		let self = this;
		self.twit = twit;
	}
	
	startStream() {
		let self = this;
		
		let stream = self.twit.stream('user');
		
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
	}
	
	_replyMultiple(data) {
		let self = this;
		
		let cards = self.card.pickMultipleCards();
		
		self.image.createImage(cards, (buffer) => {
			var str = '@' + data.user.screen_name + '\n';
			for(var i = 0; i < 10; ++i) {
				str += cards[i][0].ds_rarity.toUpperCase() + ' ' + cards[i][0].ds_name + '\n';
			}
			self._tweet(str, data.id_str, buffer);
		});
	}
	
	_replySingle(data) {
		var self = this;
		
		let cards = self.card.pickSingleCard();
		
		self.image.createImage(cards, (buffer) => {
			var str = '@' + data.user.screen_name + '\n';
			str += cards[0].ds_rarity.toUpperCase() + ' ' + cards[0].ds_name + '\n';
			
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
					if(err[0] && err[0].code == 185) {
						self.twit.post('account/update_profile', {
							name: '[리밋] 데레스테 가챠 봇'
						}, function(err, res) {
							if(err) {
								console.log(err);
							}
							self.user.limit = true;
						});
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
