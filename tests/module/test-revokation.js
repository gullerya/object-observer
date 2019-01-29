import {Observable} from '../../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({name: 'Testing revokation of removed/replaced objects'});

suite.addTest({name: 'test revokation of replaced objects - simple set'}, (pass, fail) => {
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
		if (changes.length !== 1 || changes[0].type !== 'update') fail('expected to track one update change');
		if (changes[0].oldValue.prop !== 'text') fail('expected the old value to still be readable');
		if (changes[0].value.prop !== 'text') fail('expected the new value to be readable');
	});

	og.a = og.a.b;
	if (og.a.prop !== 'text') fail('expected the new value on the observed graph to be accessible');

	pass();
});

suite.addTest({name: 'test revokation of replaced objects - splice in array'}, (pass, fail) => {
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
		if (changes.length !== 1 || changes[0].type !== 'update') fail('expected to track one update change');
		if (changes[0].oldValue.prop !== 'text') fail('expected the old value to still be readable');
		if (changes[0].value.prop !== 'text') fail('expected the new value to be readable');
	});

	og.splice(0, 1, og[0].child);
	if (og[0].prop !== 'text') fail('expected the new value on the observed graph to be accessible');

	pass();
});

suite.run();
