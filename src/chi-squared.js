/** # Independence test

Player performance comparisons and tests based on hypothesis testing.
*/
exports.compare = function compare(game, player1, player2, opponents, matchCount) {
	player2 = player2 || new ludorum.players.RandomPlayer({ name: 'RandomPlayer' });
	opponents = opponents || [new ludorum.players.RandomPlayer({ name: 'RandomOpponent' })];
	matchCount = +matchCount || 400;
	var contest1 = new ludorum.tournaments.Measurement(game, player1, opponents, matchCount),
		contest2 = new ludorum.tournaments.Measurement(game, player2, opponents, matchCount);
	return base.Future.all([contest1.run(), contest2.run()]).then(function () {
		var result = {};
		game.players.forEach(function (role) {
			var stats1 = contest1.statistics,
				stats2 = contest2.statistics;
			(result[player1.name] || (result[player1.name] = {}))[role] = [
				stats1.count({ key: 'victories', role: role, player: player1.name }),
				stats1.count({ key: 'draws', role: role, player: player1.name }),
				stats1.count({ key: 'defeats', role: role, player: player1.name })
			];
			(result[player2.name] || (result[player2.name] = {}))[role] = [
				stats2.count({ key: 'victories', role: role, player: player2.name }),
				stats2.count({ key: 'draws', role: role, player: player2.name }),
				stats2.count({ key: 'defeats', role: role, player: player2.name })
			];
		});
		return result;
	});
};

// ## Chi squared test #############################################################################

var CHI_SQUARED_CRITICAL_VALUES = {
	'0.1': 2.706,
	'0.05': 3.841,
	'0.01': 6.635
};

/** The function `chiSquared1` performs a chi squared independence test. The arguments `result1` and
`result2` must be arrays with three numbers in this order: amount of matches won, tied and lost. 
*/
exports.chiSquared1 = function chiSquared1(results1, results2, options) {
	var won1 = results1[0], 
		won2 = results2[0],
		lost1 = results1[2], 
		lost2 = results2[2],
		chiSq = Math.pow(won1 * lost2 - won2 * lost1, 2) * (won1 + won2 + lost1 + lost2) /
			(won1 + lost1) / (won2 + lost2) / (lost1 + lost2) / (won1 + won2),
		significance = options && options.significance || 0.05,
		criticalValue = options && options.criticalValue || 
			CHI_SQUARED_CRITICAL_VALUES[''+ significance];
	return {
		chiSquared: chiSq,
		comparison: (chiSq < criticalValue) ? 0 : won1 - won2,
		effect: Math.sqrt(chiSquared / (won1 + won2 + lost1 + lost2))
	};
};

// ## Fisher exact test ############################################################################

var __fisherTestP2x2__ = exports.__fisherTestP2x2__ = function __fisherTestP2x2__(a, b, c, d) {
	var n = a + b + c + d,
		factors = new Array(n + 1);
	[a + b, c + d, a + c, b + d].forEach(function (x) {
		for (var i = 2; i <= x; i++) {
			factors[i] = (factors[i] |0) + 1;
		}
	});
	[a, b, c, d, n].forEach(function (x) {
		for (var i = 2; i <= x; i++) {
			factors[i] = (factors[i] |0) - 1;
		}
	});
	console.log(factors.join(','));//FIXME
	var r = 1;
	for (var fi = 2, di = 2; fi <= n || di <= n; ) {
		if (r <= 1 && fi <= n) {
			if (factors[fi] > 0) {
				r *= Math.pow(fi, factors[fi]);
			}
			fi++;
		} else {
			if (factors[di] < 0) {
				r *= Math.pow(di, factors[di]);
			}
			di++;
		}
	}
	return r;
};

exports.fisherTest = function fisherTest(results1, results2, options) {
	var significance = options && options.significance || 0.05,
		p = __fisherTestP2x2__(results1[0], results1[2], results2[0], results2[2]);
	return {
		p: p,
		comparison: isNaN(p) ? NaN : (p > significance) ? 0 : results1[0] - results2[0]
	};
};