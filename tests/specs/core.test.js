/* 
*/
define(['creatartis-base', 'ludorum', 'ludorum-player-assess'], function (base, ludorum, assess) {

	describe("Library", function () { /////////////////////////////////////////////////////////////
		it("layout", function () {
			expect(typeof assess.compare).toBe('function');
			expect(typeof assess.fisher2x2).toBe('function');
		});

		it('fisher tests', function () {
			expect(assess.fisher2x2([100,0], [100,0]).comparison).toBe(0);
			expect(assess.fisher2x2([100,0], [0,100]).comparison).toBeGreaterThan(0);
			expect(assess.fisher2x2([0,100], [100,0]).comparison).toBeLessThan(0);
			expect(assess.fisher2x2([50,50], [70,70]).comparison).toBe(0);
			expect(assess.fisher2x2([300,100], [325,75]).comparison).toBeLessThan(0);
			expect(assess.fisher2x2([300,100], [325,75], 0.01).comparison).toBe(0);
		});
	}); // layout

}); // define.
