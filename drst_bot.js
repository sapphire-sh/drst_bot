var fs = require('fs');	
var lwip = require('lwip');

var config = JSON.parse(fs.readFileSync(__dirname + '/config.json').toString().trim());

var OFFSET = 12;
var IMG_SIZE = 88 + OFFSET;

var limit = false;

var db = require('mysql').createConnection(config.db);
db.connect();
db.query('SELECT * FROM `drst_bot` WHERE 1;', function(err, rows) {
	if(err) {
		console.error(err);
		return;
	}
	
	var _ = require('underscore');
	
	var cards = [];
	var raw_cards = [];
	_.each(rows, function(row) {
		var count = row.ds_multiplier;
		while(count > 0) {
			cards.push(row);
			--count;
		}
		raw_cards.push(row);
	});
	cards = _.groupBy(cards, function(card) {
		return card.ds_rarity;
	});
	
	var express = require('express');
	var app = express();
	app.set('view engine', 'ejs');
	app.use(express.static('data'));
	
	app.get('/', function(req, res) {
		res.render('index', {
			cards: raw_cards
		});
	});
	
	app.listen(config.port);
	var tw = new require('twitter')(config.twitter);
	
	tw.get('users/show', {
		screen_name: 'drst_bot'
	}, function(err, res) {
		if(err) {
			console.error(err);
		}
		
		if(res.name.match(/리밋/)) {
			limit = true;
		}
	});

	tw.stream('user', function(stream) {
		stream.on('follow', function(data) {
			if(data.event == 'follow') {
				if(data.source.screen_name != 'drst_bot') {
					tw.post('friendships/create', {
						user_id: data.source.id_str
					}, function(err, res) {
						if(err) {
							console.log(err);
						}
					});
				}
			}
		});
		
		stream.on('data', function(data) {
			if(!data.event && !data.retweeted_status && data.text && !limit) {
				console.log(data.text);
				var flag = false;
				for(var i = 0; i < data.entities.user_mentions.length; ++i) {
					if(data.entities.user_mentions[i].screen_name == 'drst_bot') {
						flag = true;
						break;
					}
				}
				
				if(flag && data.text.match(/가챠|뽑기/)) {
					console.log(data.text);
					var c = [];
					for(var i = 0; i < 10; ++i) {
						var r = Math.random();
						if(r < 0.015) {
							c.push(_.sample(cards.ssr, 1));
						}
						else if(r < 0.10) {
							c.push(_.sample(cards.sr, 1));
						}
						else {
							if(i == 9) {
								c.push(_.sample(cards.sr, 1));
							}
							else {
								c.push(_.sample(cards.r, 1));
							}
						}
					}
					
					lwip.create(IMG_SIZE * 5, IMG_SIZE * 2, { a: 0, r: 0, g: 0, b: 0 }, function(err, image) {
						var filenames = [];
						for(var i = 0; i < 10; ++i) {
							filenames.push(c[i][0].ds_filename);
						}
						open(filenames, [], function(srcs) {
							paste(image, srcs, 0, 0, function(dst) {
								dst.toBuffer('png', function(err, buffer) {
									if(err) {
										console.log(err);
									}
									tw.post('media/upload', {
										media: buffer
									}, function(err, res) {
										if(err) {
											console.log(err);
										}
										tw.post('statuses/update', {
											status: '@' + data.user.screen_name,
											in_reply_to_status_id: data.id_str,
											media_ids: res.media_id_string
										}, function(err, res) {
											if(err) {
												if(err[0].code == 185) {
													tw.post('account/update_profile', {
														name: '[리밋] 데레스테 가챠 봇'
													}, function(err, res) {
														if(err) {
															console.log(err);
														}
														limit = true;
													});
												}
												else {
													console.log(err);
												}
											}
										});
									});
								});
							});
						});
					});
				}
			}
		});
		
		stream.on('error', function(err) {
			console.log(err);
		});
	});
});

db.end();

function open(filenames, srcs, callback) {
	var filename = filenames.pop();
	if(filename === undefined) {
		callback(srcs);
	}
	else {
		lwip.open('data/' + filename, function(err, image) {
			srcs.push(image);

			open(filenames, srcs, callback);
		});
	}
}

function paste(dst, srcs, left, top, callback) {
	var src = srcs.pop();
	if(src === undefined) {
		callback(dst);
	}
	else {
		dst.paste(left + OFFSET / 2, top + OFFSET / 2, src, function(err, image) {
			paste(image, srcs, (left + IMG_SIZE) % (IMG_SIZE * 5), (left == IMG_SIZE * 4 ? IMG_SIZE : top), callback);
		});
	}
}

function resolve_limit(offset) {
	if(limit) {
		offset = offset === undefined ? 0 : offset;
		tw.post('statuses/update', {
			status: "리밋이 해제되었습니다. " + offset
		}, function(err, res) {
			if(err) {
				console.log(err);
				if(err[0].code == 187) {
					resolve_limit(offset + 1);
				}
			}
			else {
				tw.post('account/update_profile', {
					name: '데레스테 가챠 봇'
				}, function(err, res) {
					if(err) {
						console.log(err);
					}
					limit = false;
				});
			}
		});
	}
};

setInterval(resolve_limit, 60000);

