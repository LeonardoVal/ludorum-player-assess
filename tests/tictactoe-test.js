/**
 
*/
var base = require('creatartis-base'),
	ludorum = require('ludorum'),
	assess = require('../build/ludorum-player-assess');

var LOGGER = base.Logger.ROOT;
LOGGER.appendToConsole();
assess.compare({
	game: new ludorum.games.TicTacToe(),
	players: [
		new ludorum.players.RandomPlayer({ name: "RANDOM" }),
		new ludorum.players.AlphaBetaPlayer({ name: "MMAB2", horizon: 2 }),
		new ludorum.players.AlphaBetaPlayer({ name: "MMAB4", horizon: 4 }),
		new ludorum.players.MonteCarloPlayer({ name: "MCTS100", simulationCount: 100 })
	],
	logger: LOGGER
}).then(function (r) {
	console.log(r);
	var stats = assess.statistics;
	for (var i = 0; i < r.length - 1; i++) {
		console.log("Fisher 2x2 Xs:",
			stats.fisher2x2([r[i].Xs[0], r[i].Xs[2]], [r[i + 1].Xs[0], r[i + 1].Xs[2]], 0.05));
		console.log("Fisher 2x2 Os:",
			stats.fisher2x2([r[i].Os[0], r[i].Os[2]], [r[i + 1].Os[0], r[i + 1].Os[2]], 0.05));
		console.log("Fisher 2x3 Xs:",
			stats.fisher2x3(r[i].Xs, r[i + 1].Xs, 0.05));
		console.log("Fisher 2x3 Os:",
			stats.fisher2x3(r[i].Os, r[i + 1].Os, 0.05));
	}
});