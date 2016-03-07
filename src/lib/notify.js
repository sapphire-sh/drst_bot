'use strict';

const schedule	= require('node-schedule');

class Notification {
	constructor(twit) {
		let self = this;
		self.twit = twit;

		self._startScheduler();
	}
	
	_startScheduler() {
		let self = this;
		
		schedule.scheduleJob('1 0 * * *', () => {
			let status = '오늘의 가챠 @drst_bot';
			
			self.twit.post('statuses/update', {
				status: status
			}, (err, data, res) => {
				if(err) {
					console.log(err);
				}
			});
		});
		
		schedule.scheduleJob('2 0,12,18 * * *', () => {
			let status = '데레스테 가챠 봇 입니다.\n\'가챠\' 또는 \'뽑기\'를 포함한 멘션을 보내면 10연 가챠를 시뮬레이션 해서 보내드립니다.\n';
			status += '봇이 멘션에 5초 안에 반응하지 않는다면 다시 멘션 보내주세요.\n';
			status += '봇이 리밋 상태일 경우 봇 이름에 [리밋]으로 표시 됩니다. ' + new Date().getHours();
			
			self.twit.post('statuses/update', {
				status: status
			}, (err, data, res) => {
				if(err) {
					console.log(err);
				}
			});
		});
	}
}

module.exports = Notification;
