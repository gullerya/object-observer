//	LCOV format reference: http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php
//	in general as an example below
//	--- before zero line of report ---
//	TN:<test name>							--	optional
//											--	empty lines allowed
//	SF:<path to the source file>			--	section per file, this is the section start
//	...										--	omitting the AST related knowledge of functions and branches (FN, FNDA, FNF, FNH, BRDA, BRF, BRH)
//	DA:<line number>,<execution count>		--	this is mostly the body of the coverage
//	DA:50,3
//	DA:52,0
//	...
//	LF:<total of coverable lines>			--	these 2 summarizing lines should come at the end of the section
//	LH:<total of hit lines>
//	end_of_record							--	designates end of section

const
	os = require('os');

module.exports = {
	convert: convert
};

function convert(coverageData) {
	let result = '';
	result += 'SF:' + filename + os.EOL;

	data.source.forEach(line, num => {
		num++;

		if (data[num] !== undefined) {
			result += 'DA:' + num + ',' + data[num] + os.EOL;
		}
	});

	result += 'end_of_record';
	return result;
}