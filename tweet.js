var fs = require('fs');
var twitter = require('twitter');

var config = JSON.parse(fs.readFileSync('config.json').toString().trim());

var tw = new twitter(config.twitter);

var status;
switch(process.argv[2]) {
case 'info':
	status = '데레스테 가챠 봇 입니다.\n\'가챠\' 또는 \'뽑기\'를 포함한 멘션을 보내면 10연 가챠를 시뮬레이션 해서 보내드립니다.\n봇이 멘션에 5초 안에 반응하지 않는다면 다시 멘션 보내주세요.\n봇이 리밋 상태일 경우 봇 이름에 [리밋]으로 표시 됩니다. ' + new Date().getHours();
	break;
case 'gacha':
	status = '오늘의 가챠 @drst_bot';
	break;
}

if(status) {
	tw.post('statuses/update', {
		status: status
	}, function(err, res) {
		if(err) {
			console.log(err);
		}
	});
}

