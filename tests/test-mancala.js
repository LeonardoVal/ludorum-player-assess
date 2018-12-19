/** # Test with Mancala

Measuring generic players playing Mancala.

Results: ```{ 
	North: { 
		RANDOM:  [ 192, 27, 181 ],	
		MCTS1:   [ 324, 14, 62 ],
		MCTS2:   [ 329, 18, 53 ],
		MCTS5:   [ 359, 9, 32 ],
		MCTS10:  [ 369, 9, 22 ],
		MCTS20:  [ 376, 9, 15 ],
		MCTS50:  [ 385, 2, 13 ],
		MCTS100: [ 395, 3, 2 ],
		MMAB2: [ 317, 16, 67 ],
		MMAB4: [ 365, 3, 32 ],
		MMAB6: [ 384, 3, 13 ]
     },
	South: { 
		RANDOM: [ 183, 29, 188 ],
		MCTS1: [ 64, 5, 331 ],
		MCTS2: [ 62, 21, 317 ],
		MCTS5: [ 42, 14, 344 ],
		MCTS10: [ 28, 12, 360 ],
		MCTS20: [ 11, 12, 377 ],
		MCTS50: [ 4, 4, 392 ],
		MCTS100: [ 6, 4, 390 ],
		MMAB2: [ 90, 18, 292 ],
		MMAB4: [ 41, 6, 353 ],
		MMAB6: [ 19, 6, 375 ]
	}
}```
*/
var base = require('creatartis-base'),
	ludorum = require('ludorum'),
	mancala = require('@creatartis/ludorum-game-mancala'),
	assess = require('../build/ludorum-player-assess');

var LOGGER = base.Logger.ROOT;
LOGGER.appendToConsole();
var RANDOM = new ludorum.players.RandomPlayer({ name: "RANDOM" }),
	MCTSs = [1, 2, 5, 10, 20, 50, 100].map(function (simulationCount) {
		return new ludorum.players.MonteCarloPlayer({ 
			name: "MCTS"+ simulationCount, 
			simulationCount: simulationCount
		});
	}),
	MMABs = [2, 4, 6].map(function (horizon) {
		return new ludorum.players.AlphaBetaPlayer({
			name: "MMAB"+ horizon,
			horizon: horizon
		});
	}),
	MANCALA = new mancala.Mancala(); 

assess.config({ logger: LOGGER });
assess.measure([RANDOM].concat(MCTSs).concat(MMABs))
	.playing(MANCALA)
	.againstRandom({ matchCount: 400 })
	.then(function (r) {
		console.log(r.Mancala);
	});