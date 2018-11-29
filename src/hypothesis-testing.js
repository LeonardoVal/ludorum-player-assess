/** # Independence test

Player performance comparisons and tests based on hypothesis testing.
*/

exports.compare = function compare(args) {
	raiseIf(!args || !args.game, "Missing `game` argument!");
	var game = args.game,
		players = args.players || [new ludorum.players.RandomPlayer({ name: 'RandomPlayer' })],
		opponents = args.opponents || [new ludorum.players.RandomPlayer({ name: '__RandomOpponent__' })],
		matchCount = +args.matchCount || 400,
		logger = args.logger,
		contests = players.map(function (player) {
			return new ludorum.tournaments.Measurement(game, player, opponents, matchCount);
		}),
		intervalId;
	if (logger) {
		logger.info("Starting "+ matchCount * players.length * 2 +" matches of "+ game.name +".");
		var matchesPlayed = 0;
		contests.forEach(function (contest) { 
			contest.events.on('afterMatch', function () {
				matchesPlayed++;
			});
		});
		intervalId = setInterval(function () {
			logger.info("Played "+ matchesPlayed +"/"+ matchCount * players.length * 2 +" matches.");
		}, args.logTime || 20000);
	}
	return base.Future.all(contests.map(function (contest) {
		return contest.run();
	})).then(function () {
		if (logger) {
			clearInterval(intervalId);
			logger.info("Played "+ matchesPlayed +"/"+ matchCount * players.length * 2 +" matches.");
		}
		return statistics.fisherWithTournaments({
			game: game,
			tournaments: contests
		});
	});
};

// ## Fisher exact test ############################################################################

/** Part of Fisher's exact test is the hypergeometric rule, which is used to calculate the 
probability of a given contingency table.

The formula is $ p=\frac{(a+b)!(c+d)!(a+c)!(b+d)!}{a!b!c!d!n!} $. Calculating all factorials can 
overflow the 64 bits double floating point precision, and even if it does not is quite inefficient. 
This algorithm lists all factors (and divisors), simplifying the calculation as much as possible, 
and ordering multiplications and divisions to minimize the chance of overflow.
*/
var hypergeometricRule = statistics.hypergeometricRule = function hypergeometricRule(row1, row2) {
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

/** Fisher's exact test for contingency tables of 2 rows per 2 columns. Both arguments `row1` and
`row2` must be arrays of two possitive integers, and `alpha` indicates the significance of the
hypothesis test (5% or 0.05 by default).

The result is an object with:

+ `p_value`: The _p_ value for the test.

+ `comparison`: A number complaint with sorting functions (i.e. negative if `row1` is less than 
`row2`, possitive if `row1` is greater than `row2`, zero otherwise). If the p value is greater than
`alpha` the comparison is zero, else the difference of the values of the first column is returned.
*/
statistics.fisher2x2 = function fisher2x2(row1, row2, alpha) {
    raiseIf(row1.length !== 2 || row2.length !== 2, "Contingency table should be 2x2!");
    alpha = isNaN(alpha) ? 0.05 : +alpha;
    var a = row1[0], b = row1[1],
        c = row2[0], d = row2[1],
        r1 = a + b, r2 = c + d,
        c1 = a + c, c2 = b + d,
	   cutoff = Math.abs(a / r1 - c / r2),
	   max_a = Math.min(r1, c1),
        p_value = 0,
        disprop, p;
    for (a = 0; a <= max_a; a++) {
		b = r1 - a;
		c = c1 - a;
		d = r2 - c;
		if (d >= 0) {
			disprop = Math.abs(a / r1 - c / r2);
			if (disprop >= cutoff) {
				p = hypergeometricRule([a, b], [c, d]);
				p_value += p;
			}
		}
    }
    return {
        p_value: p_value,
        comparison: p_value > alpha ? 0 : (row1[0] - row2[0])
    };
};

/** Fisher's exact test for contingency tables of 2 rows per 3 columns. Both arguments `row1` and
`row2` must be arrays of three possitive integers, and `alpha` indicates the significance of the
hypothesis test (5% or 0.05 by default).

The result is an object with:

+ `p_value`: The _p_ value for the test.

+ `comparison`: A number complaint with sorting functions (i.e. negative if `row1` is less than 
`row2`, possitive if `row1` is greater than `row2`, zero otherwise). If the p value is greater than
`alpha` the comparison is zero. Else the difference of the values of the first column is returned if
not zero. Else the difference of the values of the second column normalized between 0 and 1 is 
returned.
*/
statistics.fisher2x3 = function fisher2x3(row1, row2, alpha) {
	raiseIf(row1.length !== 3 || row2.length !== 3, "Contingency table should be 2x3!");
	alpha = isNaN(alpha) ? 0.05 : +alpha;
	var a = row1[0], b = row1[1], c = row1[2],
		d = row2[0], e = row2[1], f = row2[2],
		r1 = a + b + c, r2 = d + e + f,
		c1 = a + d, c2 = b + e, c3 = c + f,
		cutoff = hypergeometricRule([a, b, c], [d, e, f]),
		max_a = Math.min(r1, c1),
		p_value = 0,
		p, max_b;
	for (a = 0; a <= max_a; a++) {
		max_b = Math.min(r1 - a, c2);
		for (b = 0; b <= max_b; b++) {
			c = r1 - a - b;
			d = c1 - a;
			e = c2 - b;
			f = c3 - c;
			if (f >= 0) {
				p = hypergeometricRule([a, b, c], [d, e, f]);
				if (p <= cutoff) {
					p_value += p;
				}
			}
		}
	}
	return {
		p_value: p_value,
		comparison: p_value > alpha ? 0 : (row1[0] - row2[0] || (row1[1] - row[1]) / (c2 + 1))
	};
};

function tournamentResults(tournaments) {
	var results = {};
	tournaments.forEach(function (tournament, i) {
		var stats = tournament.statistics;
		base.iterable(stats.__stats__).forEachApply(function (_, stat) {
			var playerName = stat.keys.player,
				role = stat.keys.role;
			if (!results[playerName]) {
				results[playerName] = {};
			}
			if (!results[playerName][role]) {
				results[playerName][role] = [0, 0, 0];
			}
			var r = results[playerName][role];
			if (stat.keys.key === 'victories') {
				r[0] += stat.count();
			} else if (stat.keys.key === 'draws') {
				r[1] += stat.count();
			} else if (stat.keys.key === 'defeats') {
				r[2] += stat.count();
			}
		});
	});
	return results;
}

/**
*/ 
statistics.fisherWithTournaments = function fisherWithTournament(args) {
	var tournaments = args.tournaments || args.tournament && [args.tournament],
		game = args.game || tournaments[0].game,
		players = args.players && args.players.map(function (p) {
			return p.name;
		}),
		alpha = isNaN(args.alpha) ? 0.05 : +args.alpha,
		logger = args.logger,
		_tournamentResults = tournamentResults(tournaments),
		result = {};
	if (logger) {
		logger.info("Analyzing tournament results for "+ game.name +".");
	}
	game.players.forEach(function (role) {
		if (!result[role]) {
			result[role] = { };
		}
		base.iterable(Object.keys(_tournamentResults)).combinations(2).forEachApply(function (p1, p2) {
			if (players) {
				if (players.indexOf(p1) < 0 || players.indexOf(p2) < 0) {
					return; // Break, since one of the players is not in the `players` list.
				}
			} else {
				if (/^__.*__$/.test(p1) || /^__.*__$/.test(p2)) {
					return; // Break, since players named with `__name__` are ignored.
				}
			}
			if (logger) {
				logger.info("Performing Fisher exact test for "+ p1 +" vs "+  p2 +".");
			}
			var r1 = _tournamentResults[p1][role],
				r2 = _tournamentResults[p2][role];
			result[role][p1 +'|'+ p2] = {
				'won/lost': statistics.fisher2x2([r1[0], r1[2]], [r2[0], r1[2]], alpha),
				'won/tied+lost': statistics.fisher2x2([r1[0], r1[1] + r1[2]], [r2[0], r1[2] + r1[2]], alpha),
				'won/tied/lost': statistics.fisher2x3(r1, r2, alpha)
			};
		});
	});
	return result;
};