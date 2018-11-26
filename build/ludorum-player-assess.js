(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum")); // CommonJS module.
			} else {
				this["ludorum-player-assess"] = init(this.base,this.Sermat,this.ludorum); // Browser.
			}
		}).call(this,/** Library wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var raiseIf = base.raiseIf;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
			__package__: 'ludorum-player-assess',
			__name__: 'ludorum_player_assess',
			__init__: __init__,
			__dependencies__: [base, Sermat], ludorum,
			__SERMAT__: { include: [base, ludorum] }
		},
		/* Namespace for statistical functions and utilities */
		statistics = exports.statistics = { }
	;

/** # Independence test

Player performance comparisons and tests based on hypothesis testing.
*/

exports.compare = function compare(args) {
	raiseIf(!args || !args.game, "Missing `game` argument!");
	var game = args.game,
		players = args.players || [new ludorum.players.RandomPlayer({ name: 'RandomPlayer' })],
		opponents = args.opponents || [new ludorum.players.RandomPlayer({ name: 'RandomOpponent' })],
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
		return contests.map(function (contest, i) {
			var stats = contest.statistics,
				player = players[i],
				r = base.iterable(game.players).map(function (role) {
					return [role, [
						stats.count({ key: 'victories', role: role, player: player.name }),
						stats.count({ key: 'draws',     role: role, player: player.name }),
						stats.count({ key: 'defeats',   role: role, player: player.name })
					]];
				}).toObject();
			r.player = player.name;
			return r;
		});
	}).then(function (r) {
		if (logger) {
			clearInterval(intervalId);
			logger.info("Played "+ matchesPlayed +"/"+ matchCount * players.length * 2 +" matches.");
		}
		return r;
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

// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-player-assess.js.map