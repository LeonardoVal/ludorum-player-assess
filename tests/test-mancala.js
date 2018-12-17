/**
 
*/
var base = require('creatartis-base'),
	ludorum = require('ludorum'),
	mancala = require('@creatartis/ludorum-game-mancala'),
	assess = require('../build/ludorum-player-assess');

var LOGGER = base.Logger.ROOT;
LOGGER.appendToConsole();
var RANDOM = new ludorum.players.RandomPlayer({ name: "RANDOM" }),
	MCTS50 = new ludorum.players.MonteCarloPlayer({ name: "MCTS50", simulationCount: 50 }),
	MCTS100 = new ludorum.players.MonteCarloPlayer({ name: "MCTS100", simulationCount: 100 }),
	MANCALA = new mancala.Mancala(); 

assess.config({ logger: LOGGER });
assess.measure([RANDOM, MCTS50, MCTS100])
.playing(MANCALA)
.againstRandom({ matchCount: 400 })
.then(function (r) {
	console.log(r.Mancala);
});