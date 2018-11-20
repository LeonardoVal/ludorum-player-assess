/**
 
*/
var base = require('creatartis-base'),
	ludorum = require('ludorum'),
	assess = require('../build/ludorum-player-assess');

var LOGGER = base.Logger.ROOT;
LOGGER.appendToConsole();
assess.compare({
	game: new ludorum.games.TicTacToe(),
	player1: new ludorum.players.AlphaBetaPlayer({ name: "MMAB2", horizon: 2 }),
	player2: new ludorum.players.AlphaBetaPlayer({ name: "MMAB4", horizon: 4 }),
	logger: LOGGER
}).then(function (assessment) {
	console.log(assessment);
	console.log("Fisher 2x3 Xs:",
		assess.fisher2x3(assessment.MMAB2.Xs, assessment.MMAB4.Xs, 0.05));
	console.log("Fisher 2x3 Os:",
		assess.fisher2x3(assessment.MMAB2.Os, assessment.MMAB4.Os, 0.05));
});