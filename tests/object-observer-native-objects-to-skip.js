import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { Observable } from '../src/object-observer.js';

const suite = getSuite('Testing Observable - non-observables');

suite.test('creating observable from non-observable should throw an error', () => {
	const objectsToTest = [
		new Date()
	];

	for (const one of objectsToTest) {
		try {
			Observable.from(one);
			throw new Error('should not get to this point');
		} catch (e) {
			assert.include(e.message, 'found to be one of a non-observable types');
		}
	}

	const o = Observable.from(objectsToTest);
	assert.isTrue(objectsToTest.every(one => o.some(oo => oo === one)));
});

suite.test('non-observable in an object subgraph should stay unchanged', () => {
	const o = {
		data: new Date(),
		object: {}
	};
	const po = Observable.from(o);

	Object.keys(o).forEach(key => {
		if (key === 'object') {
			assert.notStrictEqual(o[key], po[key]);
		} else {
			assert.strictEqual(o[key], po[key]);
		}
	});
});

suite.test('non-observable in an array subgraph should stay unchanged', () => {
	const a = [
		{},
		new Date()
	];
	const o = Observable.from(a);

	a.forEach((elem, index) => {
		if (index === 0) {
			assert.notStrictEqual(a[index], o[index]);
		} else {
			assert.strictEqual(a[index], o[index]);
		}
	});
});

suite.test('non-observable should not throw when nullified', () => {
	const oo = Observable.from({
		date: new Date()
	});

	Observable.observe(oo, () => { });
	oo.date = null;
});

suite.test('non-observable should be handled correctly when replaced', () => {
	const oo = Observable.from({
		date: new Date()
	});

	assert.isTrue(oo.date instanceof Date);

	oo.date = new Date(2020, 10, 5);

	assert.isTrue(oo.date instanceof Date);
});

suite.test('non-observable deviation should be handled correctly when replaced', () => {
	const
		o = {
			date: new Date()
		},
		oo = Observable.from(o);

	assert.strictEqual(oo.date, o.date);

	oo.date = new Date();

	assert.isTrue(oo.date instanceof Date);
});

suite.test('non-observable should be handled correctly when deleted', () => {
	const oo = Observable.from({
		date: new Date()
	});

	Observable.observe(oo, () => { });
	delete oo.date;
});
