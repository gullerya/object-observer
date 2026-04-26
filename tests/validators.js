import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { Observable, Validator } from '../src/object-observer.ts';
import { Change } from '../src/model/change.ts';
import { oMetaKey } from '../src/constants.ts';

test('test validators - ctor direct use forbidden', () => {
	assert.throws(() => new Validator('some', () => { }), 'Validator class cannot be instantiated directly');
});

test('custom validator - positive cases', () => {
	const validatorLogic = () => { };
	const v = Validator.custom(validatorLogic);
	assert.strictEqual(v.validate, validatorLogic, 'Validator code is correct');
});

test('custom validator - negative cases', () => {
	assert.throws(() => Validator.custom(null), 'custom Validator requires a function as argument');
	assert.throws(() => Validator.custom('some'), 'custom Validator requires a function as argument');
});

test('custom validator - validate invokes passed fn - success path (no throw)', () => {
	let called = 0;
	const v = Validator.custom(changes => { called = changes.length; });
	const changes = [new Change('update', ['a'], 1, 0), new Change('update', ['b'], 2, 0)];
	v.validate(changes);
	assert.strictEqual(called, 2);
});

test('custom validator - validate propagates throw', () => {
	const v = Validator.custom(() => { throw new Error('rejected'); });
	assert.throws(() => v.validate([new Change('update', ['a'], 1, 0)]), 'rejected');
});

test('custom validator - validate is read-only', () => {
	const v = Validator.custom(() => { });
	assert.throws(() => { v.validate = () => { }; });
});

test('Observable.from - validators option - negative - not an array', () => {
	assert.throws(
		() => Observable.from({}, { validators: 'nope' }),
		'"validators" option, if/when provided, MUST be a non-empty array of Validator instances'
	);
});

test('Observable.from - validators option - negative - number', () => {
	assert.throws(
		() => Observable.from({}, { validators: 42 }),
		'"validators" option, if/when provided, MUST be a non-empty array of Validator instances'
	);
});

test('Observable.from - validators option - negative - empty array', () => {
	assert.throws(
		() => Observable.from({}, { validators: [] }),
		'"validators" option, if/when provided, MUST be a non-empty array of Validator instances'
	);
});

test('Observable.from - validators option - negative - non-Validator element', () => {
	assert.throws(
		() => Observable.from({}, { validators: [Validator.custom(() => { }), 'bad'] }),
		'"validators" option, if/when provided, MUST be a non-empty array of Validator instances'
	);
});

test('Observable.from - validators option - negative - bare function rejected', () => {
	assert.throws(
		() => Observable.from({}, { validators: [() => { }] }),
		'"validators" option, if/when provided, MUST be a non-empty array of Validator instances'
	);
});

test('Observable.from - validators option - positive - stored on meta', () => {
	const v1 = Validator.custom(() => { });
	const v2 = Validator.custom(() => { });
	const oo = Observable.from({}, { validators: [v1, v2] });
	const stored = oo[oMetaKey].validators;
	assert.strictEqual(stored.length, 2);
	assert.strictEqual(stored[0], v1);
	assert.strictEqual(stored[1], v2);
});

//	e2e: a single "immutable-marker" validator rejecting any change whose oldValue === 'immutable'
const immutableMarker = Validator.custom(changes => {
	for (const c of changes) {
		if (c.oldValue === 'immutable') {
			throw new Error(`change at '${c.pathAsString}' rejected: oldValue is immutable`);
		}
	}
});

test('e2e - set insert - no oldValue - allowed', () => {
	const oo = Observable.from({}, { validators: [immutableMarker] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	oo.a = 'new';
	assert.strictEqual(oo.a, 'new');
	assert.strictEqual(observed, 1);
});

test('e2e - set update - oldValue not immutable - allowed', () => {
	const oo = Observable.from({ a: 'mutable' }, { validators: [immutableMarker] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	oo.a = 'other';
	assert.strictEqual(oo.a, 'other');
	assert.strictEqual(observed, 1);
});

test('e2e - set update - oldValue is immutable - throws, target unchanged, no observer fired', () => {
	const oo = Observable.from({ a: 'immutable' }, { validators: [immutableMarker] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => { oo.a = 'other'; }, `change at 'a' rejected`);
	assert.strictEqual(oo.a, 'immutable');
	assert.strictEqual(observed, 0);
});

test('e2e - delete - oldValue not immutable - allowed', () => {
	const oo = Observable.from({ a: 'mutable' }, { validators: [immutableMarker] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	delete oo.a;
	assert.isTrue(!('a' in oo));
	assert.strictEqual(observed, 1);
});

test('e2e - delete - oldValue is immutable - throws, target unchanged, no observer fired', () => {
	const oo = Observable.from({ a: 'immutable' }, { validators: [immutableMarker] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => { delete oo.a; }, `change at 'a' rejected`);
	assert.strictEqual(oo.a, 'immutable');
	assert.strictEqual(observed, 0);
});

test('e2e - change shape at validator - set insert', () => {
	let seen = null;
	const oo = Observable.from({}, {
		validators: [Validator.custom(changes => { seen = changes; })]
	});
	oo.a = 42;
	assert.strictEqual(seen.length, 1);
	const c = seen[0];
	assert.strictEqual(c.type, 'insert');
	assert.deepStrictEqual(c.path, ['a']);
	assert.strictEqual(c.value, 42);
	assert.strictEqual(c.oldValue, undefined);
	assert.strictEqual(c.object, oo);
});

test('e2e - change shape at validator - set update', () => {
	let seen = null;
	const oo = Observable.from({ a: 1 }, {
		validators: [Validator.custom(changes => { seen = changes; })]
	});
	oo.a = 2;
	assert.strictEqual(seen.length, 1);
	const c = seen[0];
	assert.strictEqual(c.type, 'update');
	assert.deepStrictEqual(c.path, ['a']);
	assert.strictEqual(c.value, 2);
	assert.strictEqual(c.oldValue, 1);
	assert.strictEqual(c.object, oo);
});

test('e2e - change shape at validator - delete', () => {
	let seen = null;
	const oo = Observable.from({ a: 1 }, {
		validators: [Validator.custom(changes => { seen = changes; })]
	});
	delete oo.a;
	assert.strictEqual(seen.length, 1);
	const c = seen[0];
	assert.strictEqual(c.type, 'delete');
	assert.deepStrictEqual(c.path, ['a']);
	assert.strictEqual(c.value, undefined);
	assert.strictEqual(c.oldValue, 1);
	assert.strictEqual(c.object, oo);
});

test('e2e - rooted path - mutation on nested observable - validator sees full path', () => {
	let seen = null;
	const oo = Observable.from({ outer: { inner: { x: 1 } } }, {
		validators: [Validator.custom(changes => { seen = changes; })]
	});
	oo.outer.inner.x = 2;
	assert.strictEqual(seen.length, 1);
	assert.deepStrictEqual(seen[0].path, ['outer', 'inner', 'x']);
});

test('e2e - raw (un-wrapped) new value at validator', () => {
	const raw = { k: 'v' };
	let seen = null;
	const oo = Observable.from({}, {
		validators: [Validator.custom(changes => { seen = changes; })]
	});
	oo.a = raw;
	assert.strictEqual(seen[0].value, raw);	//	exact same object identity, no proxy wrapping yet
});

test('e2e - multiple validators - first throws, second not called', () => {
	let v2Calls = 0;
	const v1 = Validator.custom(() => { throw new Error('v1 reject'); });
	const v2 = Validator.custom(() => { v2Calls++; });
	const oo = Observable.from({}, { validators: [v1, v2] });
	assert.throws(() => { oo.a = 1; }, 'v1 reject');
	assert.strictEqual(v2Calls, 0);
});

//	vetoing validator used across the array-method e2e tests below
const vetoAll = Validator.custom(() => { throw new Error('rejected'); });

test('e2e - array pop - vetoed - target unchanged, no observer fired', () => {
	const oo = Observable.from([1, 2, 3], { validators: [vetoAll] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => oo.pop(), 'rejected');
	assert.deepStrictEqual(Array.from(oo), [1, 2, 3]);
	assert.strictEqual(observed, 0);
});

test('e2e - array push - vetoed - target unchanged, no observer fired', () => {
	const oo = Observable.from([1, 2, 3], { validators: [vetoAll] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => oo.push(4, 5), 'rejected');
	assert.deepStrictEqual(Array.from(oo), [1, 2, 3]);
	assert.strictEqual(observed, 0);
});

test('e2e - array shift - vetoed - target unchanged, no observer fired', () => {
	const oo = Observable.from([1, 2, 3], { validators: [vetoAll] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => oo.shift(), 'rejected');
	assert.deepStrictEqual(Array.from(oo), [1, 2, 3]);
	assert.strictEqual(observed, 0);
});

test('e2e - array unshift - vetoed - target unchanged, no observer fired', () => {
	const oo = Observable.from([1, 2, 3], { validators: [vetoAll] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => oo.unshift(0), 'rejected');
	assert.deepStrictEqual(Array.from(oo), [1, 2, 3]);
	assert.strictEqual(observed, 0);
});

test('e2e - array reverse - vetoed - target unchanged, no observer fired', () => {
	const oo = Observable.from([1, 2, 3], { validators: [vetoAll] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => oo.reverse(), 'rejected');
	assert.deepStrictEqual(Array.from(oo), [1, 2, 3]);
	assert.strictEqual(observed, 0);
});

test('e2e - array sort - vetoed - target unchanged, no observer fired', () => {
	const oo = Observable.from([3, 1, 2], { validators: [vetoAll] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => oo.sort(), 'rejected');
	assert.deepStrictEqual(Array.from(oo), [3, 1, 2]);
	assert.strictEqual(observed, 0);
});

test('e2e - typed-array set - vetoed - target unchanged, no observer fired', () => {
	const oo = Observable.from(new Int32Array([1, 2, 3, 4]), { validators: [vetoAll] });
	let observed = 0;
	Observable.observe(oo, changes => { observed += changes.length; });
	assert.throws(() => oo.set([10, 20], 1), 'rejected');
	assert.deepStrictEqual(oo, new Int32Array([1, 2, 3, 4]));
	assert.strictEqual(observed, 0);
});
