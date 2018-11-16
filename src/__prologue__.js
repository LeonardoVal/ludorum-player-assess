/** Library wrapper and layout.
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
		}
	;