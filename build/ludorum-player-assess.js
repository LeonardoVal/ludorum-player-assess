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
	var raiseIf = base.raiseIf,
		declare = base.declare,
		initialize = base.initialize,
		iterable = base.iterable,
		Iterable = base.Iterable,
		Randomness = base.Randomness,
		Future = base.Future,
		Statistics = base.Statistics;

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

/** # Scanner

Component for scanning a game's tree.
*/
exports.Scanner = declare({
	/** A Scanner builds a sample of a game tree, in order to get statistics from some of all
	possible matches. The given `config` must have:
	*/
	constructor: function Scanner(config) {
		initialize(this, config)
		/** + `game`: Game to scan.
		*/
			.object('game', { ignore: true })
		/** + `maxWidth=1000`: Maximum amount of game states held at each step.
		*/
			.integer('maxWidth', { defaultValue: 1000, coerce: true })
		/** + `maxLength=50`: Maximum length of simulated matches.
		*/
			.integer('maxLength', { defaultValue: 50, coerce: true })
		/** + `random=randomness.DEFAULT`: Pseudorandom number generator to use in the simulations.
		*/
			.object('random', { defaultValue: Randomness.DEFAULT })
		/** + `statistics=<new>`: Component to gather relevant statistics.
		*/
			.object('statistics', { defaultValue: new Statistics() })
		/** + `adjustWidth`: Reduce the width of the scan window for every final state found.
		*/
			.bool('adjustWidth', { defaultValue: false, coerce: true });
	},
	
	/** A scan of a game's tree reproduces and samples the set of all possible matches from the
	given game states. The simulation halts at `maxLength` plies, and never holds more than 
	`maxWidth` game states. Since this process is asynchronous, this method returns a future.
	
	The `players` argument may provide a player for some or all of the games' roles. If available,
	they will be used to decide which move is applied to each game state. If missing, all next game
	states will be added. Ergo no players means a simulation off all possible matches.		
	*/
	scan: function scan(players) {
		var scanner = this,
			window = arguments.length < 2 ? 
				(this.game ? [this.game] : []) : 
				Array.prototype.slice.call(arguments, 1),
			ply = 0;
		this.__currentWidth__ = this.maxLength;
		return Future.whileDo(function () {
			return window.length > 0 && ply < scanner.__currentWidth__;
		}, function () {
			return Future.all(window.map(function (game) {
				return scanner.__advance__(players, game, ply);
			})).then(function (level) {
				window = iterable(level).filter(function (nexts) {
						var isEmpty = nexts.isEmpty();
						if (isEmpty && scanner.adjustWidth) {
							scanner.__currentWidth__--;
						}
						return !isEmpty;
					})
					.flatten()
					.sample(scanner.__currentWidth__, scanner.random)
					.toArray();
				return ++ply;
			});
		}).then(function () {
			scanner.statistics.add({ key:'aborted' }, window.length);
			return scanner.statistics;
		});
	},
	
	/** Performs scans for many different player setups.
	*/
	scans: function scans() {
		return Future.sequence(Array.prototype.slice.call(arguments), this.scan.bind(this));
	},
	
	/** The `__advance__` method advances the given game by one ply. This may mean for non final
	game states either instantiate random variables, ask the available player for a decision, or 
	take all next game states. Final game states are removed. 
	
	All game states are accounted in the scanner's statistics. The result is an iterable with the 
	game states to add to the next scan window.
	*/
	__advance__: function __advance__(players, game, ply) {
		if (game.isContingent) {
			return iterable(game.possibleHaps()).mapApply(function (haps, prob) {
				return game.next(haps);
			});
		} else if (this.account(players, game, ply)) {
			return Iterable.EMPTY;
		} else {
			var moves = game.moves(),
				stats = this.statistics;
			return Future.all(game.activePlayers.map(function (role) {
				if (players && players[role]) {
					var p = players[role],
						decisionTime = stats.stat({ key:'decision.time', game: game.name, 
							role: role, player: p.name });
					decisionTime.startTime();
					return Future.when(p.decision(game, role)).then(function (move) {
						decisionTime.addTime();
						return [[role, move]];
					});
				} else {
					return moves[role].map(function (move) {
						return [role, move];
					});
				}
			})).then(function (decisions) {
				return Iterable.product.apply(Iterable, decisions).map(function (moves) {
					return game.next(iterable(moves).toObject());
				});
			});
		}
	},
			
	/** The `account` method gathers statistics about the game. These include:
		
	+ `game.result`: Final game state results. Also available for victory and defeat.
	+ `game.length`: Match length in plies. Also available for victory and defeat.
	+ `game.width`: Number of available moves.
	+ `draw.length`: Drawn match length in plies.
	
	Returns whether the given game state is final or not.
	*/
	account: function account(players, game, ply) {
		var result = game.result(),
			stats = this.statistics;
		if (result) {
			iterable(game.players).forEach(function (role) {
				var r = result[role],
					p = (players && players[role]) ? players[role].name : '';
				stats.add({ key:'game.result', game:game.name, role:role, player:p }, r, game);
				stats.add({ key:'game.length', game:game.name, role:role, player:p }, ply, game);
				if (r < 0) {
					stats.add({ key:'defeat.result', game:game.name, role:role, player:p }, r, game);
					stats.add({ key:'defeat.length', game:game.name, role:role, player:p }, ply, game);
				} else if (r > 0) {
					stats.add({ key:'victory.result', game:game.name, role:role, player:p }, r, game);
					stats.add({ key:'victory.length', game:game.name, role:role, player:p }, ply, game);
				} else {
					stats.add({ key:'draw.length', game:game.name, role:role, player:p }, ply, game);
				}
			});
			return true;
		} else {
			var moves = game.moves();
			iterable(game.activePlayers).forEach(function (role) {
				stats.add({ key:'game.width', game:game.name, role:role }, moves[role].length);
			});
			return false;
		}
	},

	/** Shortcut to scan a game. 
	*/
	'static scan': function scan(config) {
		return (new this(config)).scan(config.players);
	}
}); // Scanner.


// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-player-assess.js.map