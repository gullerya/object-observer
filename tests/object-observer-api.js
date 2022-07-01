import { assert } from 'chai';
import { getSuite } from 'just-test/suite';
import { ObjectObserver, Observable } from '../src/object-observer.js';

const suite = getSuite('Testing ObjectObserver APIs');

suite.test('ensure ObjectObserver constructable', () => {
	assert.isTrue(typeof ObjectObserver === 'function');
	assert.isTrue(String(ObjectObserver).includes('class'));
});

suite.test('observe 1 object', () => {
	let calls = 0;
	const oo = new ObjectObserver(changes => {
		calls += changes.length;
	});
	const o = oo.observe({ a: 'a', b: 'b' });

	o.a = 'b';
	assert.equal(1, calls);
});

suite.test('observe returns new Observable', () => {
	const oo = new ObjectObserver(() => { });
	const o = {};
	const o1 = oo.observe(o);
	assert.notEqual(o, o1);
	assert.isTrue(Observable.isObservable(o1));
});

suite.test('observe returns same Observable if supplied with Observable', () => {
	const oo = new ObjectObserver(() => { });
	const o1 = Observable.from({});
	const o2 = oo.observe(o1);
	assert.equal(o1, o2);
});

suite.test('observe 3 objects', () => {
	const events = [];
	const oo = new ObjectObserver(changes => {
		events.push(...changes);
	});
	const o1 = oo.observe({ a: 'a' });
	const o2 = oo.observe({ b: 'b' });
	const o3 = oo.observe({ c: 'c' });

	o1.a = 'A';
	delete o2.b;
	o3.d = 'd';

	assert.equal(3, events.length);
	assert.equal('update', events[0].type);
	assert.equal(o1, events[0].object);
	assert.equal('delete', events[1].type);
	assert.equal(o2, events[1].object);
	assert.equal('insert', events[2].type);
	assert.equal(o3, events[2].object);
});

suite.test('observe 3 objects then unobserve 1', () => {
	const events = [];
	const oo = new ObjectObserver(changes => {
		events.push(...changes);
	});
	const o1 = oo.observe({ a: 'a' });
	const o2 = oo.observe({ b: 'b' });
	const o3 = oo.observe({ c: 'c' });

	o1.a = 'A';

	assert.equal(1, events.length);
	assert.equal('update', events[0].type);
	assert.equal(o1, events[0].object);

	oo.unobserve(o1);

	o1.a = '123';
	delete o2.b;
	o3.d = 'd';

	assert.equal(3, events.length);
	assert.equal('delete', events[1].type);
	assert.equal(o2, events[1].object);
	assert.equal('insert', events[2].type);
	assert.equal(o3, events[2].object);
});

suite.test('observe 3 objects > disconnect > observe', () => {
	const events = [];
	const oo = new ObjectObserver(changes => {
		events.push(...changes);
	});
	const o1 = oo.observe({ a: 'a' });
	const o2 = oo.observe({ b: 'b' });
	const o3 = oo.observe({ c: 'c' });

	o1.a = 'A';
	delete o2.b;
	o3.d = 'd';
	assert.equal(3, events.length);

	events.splice(0);
	oo.disconnect();

	o1.a = '123';
	delete o2.b;
	o3.d = 'd';
	assert.equal(0, events.length);

	oo.observe(o1);
	oo.observe(o2);

	o1.a = '1234';
	o2.b = 'something';
	assert.equal(2, events.length);
});

//	TODO: observe with options