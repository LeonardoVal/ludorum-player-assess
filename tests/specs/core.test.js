/* 
*/
define(['creatartis-base', 'ludorum', 'ludorum-player-assess'], function (base, ludorum, assess) {

	describe("Library", function () { /////////////////////////////////////////////////////////////
		it("layout", function () {
			expect(typeof assess.measure).toBe('function');
			expect(typeof assess.statistics).toBe('object');
			expect(typeof assess.statistics.hypergeometricRule).toBe('function');
			expect(typeof assess.statistics.fisher2x2).toBe('function');
			expect(typeof assess.statistics.fisher2x3).toBe('function');
		});

		/** Both 2x2 and 2x3 Fisher's exact tests can be verified with the following R code:
		
		```r
		fisher.test(matrix(c(386, 13, 1, 395, 4, 1), nrow=2, ncol=3, byrow=TRUE))
		fisher.test(matrix(c(386, 1, 395, 1), nrow=2, ncol=2, byrow=TRUE))
		```
		*/
		it('fisher tests', function () {
			var stats = assess.statistics;

			function test2x2(row1, row2, alpha, expectedPValue, expectedComparison) {
				var r = stats.fisher2x2(row1, row2, alpha);
				expect(r.comparison).toBe(expectedComparison);
				expect(r.p_value).toBeCloseTo(expectedPValue, 5);
				r = stats.fisher2x2(row2, row1, alpha);
				expect(r.comparison).toBe(-expectedComparison);
				expect(r.p_value).toBeCloseTo(expectedPValue, 5);
			}
			function test2x3(row1, row2, alpha, expectedPValue, expectedComparison) {
				var r = stats.fisher2x3(row1, row2, alpha);
				expect(r.comparison).toBe(expectedComparison);
				expect(r.p_value).toBeCloseTo(expectedPValue, 5);
				r = stats.fisher2x3(row2, row1, alpha);
				expect(r.comparison).toBe(-expectedComparison);
				expect(r.p_value).toBeCloseTo(expectedPValue, 5);
			}
			var alpha = 0.05;

			test2x2([100, 0], [100, 0], alpha, 1, 0);
			test2x2([100, 0], [0, 100], alpha, 0, 100);
			test2x2([0, 100], [100, 0], alpha, 0, -100);

			test2x2([50, 50], [70, 70], alpha, 1, 0);
			test2x2([300, 100], [325, 75], alpha, 0.03992, -25);
			test2x2([300, 100], [325, 75], 0.01, 0.03992, 0);

			test2x2([386, 1], [395, 1], alpha, 1, 0);
			test2x3([386, 13, 1], [395, 4, 1], alpha, 0.04669, -9);
			test2x3([386, 13, 1], [395, 4, 1], 0.01, 0.04669, 0);

			test2x2([28, 10], [19, 10], alpha, 0.59160, 0);
			test2x2([28, 10], [19, 10], 0.01, 0.59160, 0);
			test2x3([28, 13, 10], [19, 7, 10], alpha, 0.64661, 0);
			test2x3([28, 13, 10], [19, 7, 10], 0.01, 0.64661, 0);

			test2x2([28, 10], [29, 1], alpha, 0.01738, -1);
			test2x2([28, 10], [29, 1], 0.01, 0.01738, 0);
			test2x3([28, 13, 10], [29, 17, 1], alpha, 0.01799, -1);
			test2x3([28, 13, 10], [29, 17, 1], 0.01, 0.01799, 0);
		});
	}); // layout

}); // define.
