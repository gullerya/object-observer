import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Filter } from '../src/changes-processors/filters.ts';
import { Change } from '../src/model/change.ts';

test('test filters - ctor direct use forbidden', () => {
	assert.throws(() => new Filter('some', (change) => change.prop !== 'skip'), 'Filter class cannot be instantiated directly', 'Filter class cannot be instantiated directly');
});

test('custom filter', () => {
	const filterLogic = changes => changes.filter(c => c.value !== null);
	const f = Filter.custom(filterLogic);
	assert.strictEqual(f.fn, filterLogic, 'Filter code is correct');
});

test('exactPaths filter - positive cases', () => {
	const f = Filter.exactPaths(['a', 'b.c']);
	const changes = [
		new Change('update', ['a'], 1, 0),
		new Change('update', ['b', 'c'], 2, 0),
		new Change('update', ['a', 'b', 'c'], 3, 0),
		new Change('update', ['b', 'c', 'd'], 4, 0)
	];
	const filtered = f.fn(changes);
	assert.strictEqual(filtered.length, 2);
});

test('exactPaths filter - negative cases', () => {
	assert.throws(() => Filter.exactPaths(null), 'exactPaths Filter requires a non-empty array as argument');
	assert.throws(() => Filter.exactPaths([]), 'exactPaths Filter requires a non-empty array as argument');
});

test('test listeners invocation - listener is corrupted - null', () => {

});

test('test listeners invocation - listener is corrupted - NaF', () => {
});
