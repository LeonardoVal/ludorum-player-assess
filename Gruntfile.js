/** Gruntfile for [ludorum-player-assess.js](http://github.com/LeonardoVal/ludorum-player-assess.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('@creatartis/creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__',
			'chi-squared',
			'__epilogue__'],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
				path: 'node_modules/sermat/build/sermat-umd.js' },
			{ id: 'ludorum' }
		],
		targets: {
			build_umd: {
				fileName: 'build/ludorum-player-assess',
				wrapper: 'umd'
			},
			build_raw: {
				fileName: 'build/ludorum-player-assess-tag',
				wrapper: 'tag'
			}
		}
	});

	grunt.registerTask('default', ['build']);
};
