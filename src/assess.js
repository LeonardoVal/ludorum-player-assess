/** # Player assessment

*/

/** The `CONFIG` global object holds the default values for many arguments of player assessment 
functions.
*/
var RANDOM_OPPONENT = new ludorum.players.RandomPlayer({ name: '__RandomOpponent__' }), 
	CONFIG = {
		players: [new ludorum.players.RandomPlayer({ name: 'RandomPlayer' })],
		game: new ludorum.games.TicTacToe(),
		opponents: [RANDOM_OPPONENT],
		matchCount: 400,
		logger: null,
		logTime: 20000
	};

function defaults(args) {
	args = args || {};
	for (var k in CONFIG) {
		if (!args.hasOwnProperty(k)) {
			args[k] = CONFIG[k];
		}
	}
	return args;
}

exports.config = function config(args) {
	args = args || {};
	for (var k in CONFIG) {
		if (args.hasOwnProperty(k)) {
			CONFIG[k] = args[k];
		} else {
			args[k] = CONFIG[k];
		}
	}
	return args;
};

function runTournaments(tournaments, other) {
	other = defaults(other);
	var matchesPlayed = 0,
		logger = other.logger,
		results = {},
		intervalId;
	tournaments.forEach(function (tournament) {
		var game = tournament.game,
			gameResults = results[game.name] || (results[game.name] = { });
		tournament.events.on('afterMatch', function (match) {
			matchesPlayed++;
			var key = game.players.map(function (role) {
					return match.players[role].name;
				}).join(' ');
			if (!gameResults[key]) {
				gameResults[key] = [0, 0, 0];
			}
			var r = match.result()[game.players[0]];
			gameResults[key][r > 0 ? 0 : r === 0 ? 1 : 2]++;
		});
	});
	if (logger) {
		logger.info("Running "+ tournaments.length +" tournaments.");
		intervalId = setInterval(function () {
			logger.info("Played "+ matchesPlayed +" matches.");
		}, other.logTime);
	}
	return base.Future.all(tournaments.map(function (tournament) {
		return tournament.run();
	})).then(function () {
		if (logger) {
			clearInterval(intervalId);
			logger.info("Played "+ matchesPlayed +" matches.");
		}
		return results;
	});
}

function __compareAgainst__(players, game, opponents, other) {
	players = players || CONFIG.players;
	game = game || CONFIG.game;
	opponents = opponents || CONFIG.opponents;
	var matchCount = other && Math.max(0, other.matchCount) || CONFIG.matchCount,
		tournaments = players.map(function (player) {
			return new ludorum.tournaments.Measurement(game, player, opponents, matchCount);
		});
	return runTournaments(tournaments, other).then(function (results) {
		var gameResults = { },
			playerNames = base.iterable(players).select('name').toArray();
		for (var k in results[game.name]) {
			base.iterable(k.split(/\s+/)).zip(game.players).filterApply(function (p, _) {
				return playerNames.indexOf(p) >= 0;
			}).forEachApply(function (p, r) {
				if (!gameResults[r]) {
					gameResults[r] = {};
				}
				if (!gameResults[r][p]) {
					gameResults[r][p] = results[game.name][k];
				} else {
					gameResults[r][p][0] += results[game.name][k][0];
					gameResults[r][p][1] += results[game.name][k][1];
					gameResults[r][p][2] += results[game.name][k][2];
				}
			});
		}
		results[game.name] = gameResults;
		return results;
	});
}

exports.measure = function measure(players) {
	players = Array.isArray(players) ? players : [players];
	return {
		playing: function playing(game) {
			return {
				against: function against(opponents, other) {
					return __compareAgainst__(players, game, opponents, other);
				},
				againstRandom: function againstRandom(other) {
					return __compareAgainst__(players, game, [RANDOM_OPPONENT], other);
				}
			};
		}
	};
};
