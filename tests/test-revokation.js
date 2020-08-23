import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing revokation of removed/replaced objects' });

suite.runTest({ name: 'test revokation of replaced objects - simple set' }, () => {
	let g = {
		a: {
			b: {
				prop: 'text'
			},
			prop: 'text'
		}
	};
	let eventsCollector = [];
	let og = Observable.from(g);
	og.observe(changes => {
		eventsCollector = eventsCollector.concat(changes);
		if (changes.length !== 1 || changes[0].type !== 'update') throw new Error('expected to track one update change');
		if (changes[0].oldValue.prop !== 'text') throw new Error('expected the old value to still be readable');
		if (changes[0].value.prop !== 'text') throw new Error('expected the new value to be readable');
	});

	og.a = og.a.b;
	if (og.a.prop !== 'text') throw new Error('expected the new value on the observed graph to be accessible');
});

suite.runTest({ name: 'test revokation of replaced objects - splice in array' }, () => {
	let g = [
		{
			child: {
				prop: 'text'
			},
			prop: 'text'
		}
	];
	let eventsCollector = [];
	let og = Observable.from(g);
	og.observe(changes => {
		eventsCollector = eventsCollector.concat(changes);
		if (changes.length !== 1 || changes[0].type !== 'update') throw new Error('expected to track one update change');
		if (changes[0].oldValue.prop !== 'text') throw new Error('expected the old value to still be readable');
		if (changes[0].value.prop !== 'text') throw new Error('expected the new value to be readable');
	});

	og.splice(0, 1, og[0].child);
	if (og[0].prop !== 'text') throw new Error('expected the new value on the observed graph to be accessible');
});