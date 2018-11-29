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
	matchCount: 400,
	logger: LOGGER
}).then(function (r) {
	console.log("Results for Xs:", r.Xs);
	console.log("Results for Os:", r.Os);
});