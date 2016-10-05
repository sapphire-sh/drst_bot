'use strict';

const config = require('../../config');

let twit;
let twit_sub;
if(process.env.NODE_ENV !== 'test') {
	twit = new (require('twit'))(config.twitter);
	twit_sub = new (require('twit'))(config.twitter_sub);
}

let schedule = require('node-schedule');

const regex_multiple = /가챠|뽑기|gacha|gasha|가샤|ガシャ|がしゃ|ガチャ|がちゃ/;
const regex_single = /단챠|단발|solo|単発/;

class Twitter {
	initialize(card) {
		let self = this;
		
		return new Promise((resolve, reject) => {
			self.card = card;
			resolve();
		});
	}
	
	startStream() {
		let self = this;
		
		let stream = twit.stream('user');
		let stream_sub = twit_sub.stream('user');
		
		stream.on('follow', (data) => {
			if(data.event === 'follow' && data.source.screen_name !== 'drst_bot') {
				twit.post('friendships/create', {
					user_id: data.source.id_str
				}, (err, res) => {
					if(err) {
						console.log(err);
					}
				});
			}
		});
		
		stream.on('tweet', (data) => {
			if(!data.retweeted_status) {
				let flag = data.entities.user_mentions.some((user) => {
					return user.screen_name === 'drst_bot';
				});
				
				if(flag) {
					let text = data.text.toLowerCase();
					if(text.match(regex_multiple)) {
						self._replyMultiple(data).then().catch((e) => {
							console.log(e);
						});
					}
					else if(text.match(regex_single)) {
						self._replySingle(data).then().catch((e) => {
							console.log(e);
						});
					}
				}
			}
		});
		
		stream_sub.on('tweet', (data) => {
			if(!data.retweeted_status) {
				let flag = data.entities.user_mentions.some((user) => {
					return user.screen_name === 'drst_bot_1';
				});
				flag &= data.entities.user_mentions.every((user) => {
					return user.screen_name !== 'drst_bot';
				});
				
				if(flag) {
					let text = data.text.toLowerCase();
					if(text.match(regex_multiple)) {
						self._replyMultiple(data).then().catch((e) => {
							console.log(e);
						});
					}
					else if(text.match(regex_single)) {
						self._replySingle(data).then().catch((e) => {
							console.log(e);
						});
					}
				}
			}
		});
	}
	
	_replyMultiple(data) {
		let self = this;
		
		return self.card.pickMultipleCards().then((cards) => {
			return self.card.createImage(cards);
		}).then((buffer) => {
			let str = `@${data.user.screen_name}\n`;
			return self._tweet(str, data.id_str, buffer);
		}).catch((e) => {
			console.log(e);
		});
	}
	
	_replySingle(data) {
		let self = this;
		
		return self.card.pickSingleCard().then((cards) => {
			return self.card.createImage(cards);
		}).then((buffer) => {
			let str = `@${data.user.screen_name}\n`;
			return self._tweet(str, data.id_str, buffer);
		}).catch((e) => {
			console.log(e);
		});
	}
	
	_tweet(status, in_reply_to, buffer) {
		let self = this;
		
		return new Promise((resolve, reject) => {
			twit.post('media/upload', {
				media_data: buffer.toString('base64')
			}, (err, res) => {
				if(err) {
					throw new Error(err);
				}
				twit.post('statuses/update', {
					status: status,
					in_reply_to_status_id: in_reply_to,
					media_ids: res.media_id_string
				}, (err, res) => {
					if(err) {
						if(err.code === 185) {
							self._tweetSub(status, in_reply_to, buffer).then(() => {
								resolve();
							});
						}
						else {
							throw new Error(err);
						}
					}
					
					resolve();
				});
			});
		});
	}
		
	_tweetSub(status, in_reply_to, buffer) {
		let self = this;
		
		return new Promise((resolve, reject) => {
			twit_sub.post('media/upload', {
				media_data: buffer.toString('base64')
			}, (err, res) => {
				if(err) {
					throw new Error(err);
				}
				twit_sub.post('statuses/update', {
					status: `@drst_bot ${status}`,
					in_reply_to_status_id: in_reply_to,
					media_ids: res.media_id_string
				}, (err, res) => {
					if(err) {
						throw new Error(err);
					}
					
					resolve();
				});
			});
		});
	}
	
	startScheduler() {
		let self = this;

		schedule.scheduleJob('1 0 * * *', () => {
			let status = '오늘의 가챠 @drst_bot';

			twit.post('statuses/update', {
				status: status
			}, (err, data, res) => {
				if(err) {
					console.log(err);
				}
			});
		});

		schedule.scheduleJob('2 0,12,18 * * *', () => {
			let status = '데레스테 가챠 봇 입니다.\n\'가챠\' 또는 \'뽑기\'를 포함한 멘션을 보내면 10연 가챠를 시뮬레이션 해서 보내드립니다.\n' + new Date().getHours();

			twit.post('statuses/update', {
				status: status
			}, (err, data, res) => {
				if(err) {
					console.log(err);
				}
			});
		});
	}
}

module.exports = Twitter;

