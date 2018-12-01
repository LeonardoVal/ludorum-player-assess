/**
 
*/
var base = require('creatartis-base'),
	ludorum = require('ludorum'),
	assess = require('../build/ludorum-player-assess');

var LOGGER = base.Logger.ROOT;
LOGGER.appendToConsole();
var RANDOM = new ludorum.players.RandomPlayer({ name: "RANDOM" }),
	MMAB2 = new ludorum.players.AlphaBetaPlayer({ name: "MMAB2", horizon: 2 }),
	MMAB4 = new ludorum.players.AlphaBetaPlayer({ name: "MMAB4", horizon: 4 }),
	MMAB6 = new ludorum.players.AlphaBetaPlayer({ name: "MMAB6", horizon: 6 }),
	MCTS100 = new ludorum.players.MonteCarloPlayer({ name: "MCTS100", simulationCount: 100 }),
	TICTACTOE = new ludorum.games.TicTacToe(); 

assess.config({ logger: LOGGER });
assess.measure([RANDOM, MMAB2, MMAB4, MMAB6, MCTS100])
.playing(TICTACTOE)
.againstRandom({ matchCount: 400 })
.then(function (r) {
	console.log(r.TicTacToe);
});