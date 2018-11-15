/* 
*/
define(['creatartis-base', 'ludorum', 'ludorum-player-assess'], function (base, ludorum, assess) {

	describe("Library", function () { /////////////////////////////////////////////////////////////
		it("layout", function () {
			expect(typeof assess.compare).toBe('function');
			expect(typeof assess.fisherTest).toBe('function');
		});

		it('fisher tests', function () {
			expect(assess.fisherTest([100,0,0], [100,0,0]).comparison).toBe(0);
			expect(assess.fisherTest([100,0,0], [0,0,100]).comparison).toBeGreaterThan(0);
			expect(assess.fisherTest([0,0,100], [100,0,0]).comparison).toBeLessThan(0);
			expect(assess.fisherTest([50,0,50], [70,0,70]).comparison).toBe(0);
			expect(assess.fisherTest([300,0,100], [325,0,75]).comparison).toBeLessThan(0);
			console.log(assess.fisherTest([300,0,100], [325,0,75], 0.01));//FIXME
			expect(assess.fisherTest([300,0,100], [325,0,75], 0.01).comparison).toBe(0);
		});
	}); // layout

}); // define.
