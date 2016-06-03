'use strict';

class Limit {
	constructor(twit) {
		let self = this;
		self.twit = twit;
		self.limit = false;
		self.data = {};
		
		self.twit.get('account/verify_credentials', {}, (err, res) => {
			if(err) {
				console.error(err);
			}
			else {
				self.data = res;
				if(self.data.name.match(/리밋/)) {
					self.limit = true;
					self.intv = setInterval(self._resolveLimit.bind(self), 60 * 1000);
				}
			}
		});
	}
	
	setLimit() {
		let self = this;
		self.limit = true;
		
		self.twit.post('account/update_profile', {
			name: '[리밋] 데레스테 가챠 봇'
		}, function(err, res) {
			if(err) {
				console.log(err);
			}
		});
		
		self.intv = setInterval(self._resolveLimit.bind(self), 60 * 1000);
	}
	
	_resolveLimit(offset) {
		let self = this;
		
		offset = offset === undefined ? 0 : offset;
		
		self.twit.post('statuses/update', {
			status : "리밋이 해제되었습니다. " + offset
		}, (err, res) => {
			if (err) {
				if(err.code === 187) {
					self._resolveLimit(offset + 1);
				}
				else {
					console.log(err);
				}
			}
			else {
				self.twit.post('account/update_profile', {
					name : '데레스테 가챠 봇'
				}, (err, res) => {
					if(err) {
						console.log(err);
					}
					else {
						self.limit = false;
						clearInterval(self.intv);
					}
				});
			}
		});
	}
}

module.exports = Limit;
