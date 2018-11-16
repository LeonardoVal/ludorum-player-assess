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

// ## Fisher exact test ############################################################################

var hypergeometricRule = exports.hypergeometricRule = function hypergeometricRule(row1, row2) {
    var n = 0,
        rowSums = [0, 0],
        colSums = row1.map(function (v, i) {
            rowSums[0] += v;
            rowSums[1] += row2[i];
            n += v + row2[i];
            return v + row2[i];
        });
    var factors = new Array(n + 1);
    rowSums.concat(colSums).forEach(function (x) {
        for (var i = 2; i <= x; i++) {
            factors[i] = (factors[i] |0) + 1;
        }
    });
    [n].concat(row1, row2).forEach(function (x) {
        for (var i = 2; i <= x; i++) {
            factors[i] = (factors[i] |0) - 1;
        }
    });
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

exports.fisher2x2 = function fisher2x2(row1, row2, alpha) {
    raiseIf(row1.length !== 2 || row2.length !== 2, "Contingency table should be 2x2!");
    alpha = isNaN(alpha) ? 0.05 : +alpha;
    var a = row1[0], b = row1[1],
        c = row2[0], d = row2[1],
        r1 = a + b, r2 = c + d,
        c1 = a + c, c2 = b + d,
        cutoff = Math.abs(a / r1 - c / r2),
        max_a = Math.min(c1, r1),
        p_value = 0,
        disprop;
    for (a = 0; a <= max_a; a++) {
        b = r1 - a;
        c = c1 - a;
        d = c2 - b;
        disprop = Math.abs(a / r1 - c / r2);
        if (disprop >= cutoff) {
            p_value += hypergeometricRule([a, b], [c, d]);
        }
    }
    return {
        p_value: p_value,
        comparison: p_value > alpha ? 0 : (row1[0] - row2[0])
    };
};

exports.fisher2x3 = function fisher2x3(row1, row2, alpha) {
    raiseIf(row1.length !== 3 || row2.length !== 3, "Contingency table should be 2x3!");
    alpha = isNaN(alpha) ? 0.05 : +alpha;
    var a = row1[0], b = row1[1], c = row1[2],
        d = row2[0], e = row2[1], f = row2[2],
        r1 = a + b + c, r2 = d + e + f,
        c1 = a + d, c2 = b + e, c3 = c + f,
        cutoff = hypergeometricRule([a, b, c], [d, e, f]),
        p_value = 0,
        p;
    for (a = 0; a <= r1; a++) {
        for (b = 0; b <= r1 - a; b++) {
            c = r1 - a - b;
            d = c1 - a;
            e = c2 - b;
            f = c3 - c;
            p = hypergeometricRule([a, b, c], [d, e, f]);
            if (p <= cutoff) {
                p_value += p;
            }
        }
    }
    return {
        p_value: p_value,
        comparison: p_value > alpha ? 0 : (row1[0] - row2[0] || (row1[1] - row[1]) / (c2 + 1))
    };
};