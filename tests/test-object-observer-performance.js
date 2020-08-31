import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing Observable Load' });

suite.runTest({ name: 'creating 100,000 observables, 1,000,000 deep (x3) mutations' }, () => {
	const
		creationIterations = 100000,
		mutationIterations = 1000000,
		o = {
			name: 'Anna Guller',
			accountCreated: new Date(),
			age: 20,
			address: {
				city: 'Dreamland',
				street: {
					name: 'Hope',
					apt: 123
				}
			},
			orders: []
		};
	let po,
		changesCountA,
		changesCountB,
		started,
		ended;

	//	creation of Observable
	console.info('creating ' + creationIterations + ' observables from object...');
	started = performance.now();
	for (let i = 0; i < creationIterations; i++) {
		po = Observable.from(o);
	}
	ended = performance.now();
	console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');

	//	add listeners/callbacks
	po.observe(changes => {
		if (!changes.length) throw new Error('expected to have at least one change in the list');
		else changesCountA += changes.length;
	});
	po.observe(changes => {
		if (!changes) throw new Error('expected changes list to be defined');
		else changesCountB += changes.length;
	});

	//	mutation of existing property
	changesCountA = 0;
	changesCountB = 0;
	console.info('performing ' + mutationIterations + ' deep (x3) primitive mutations...');
	started = performance.now();
	for (let i = 0; i < mutationIterations; i++) {
		po.address.street.apt = i;
	}
	ended = performance.now();
	if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
	if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
	console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');

	//	adding new property
	changesCountA = 0;
	changesCountB = 0;
	console.info('performing ' + mutationIterations + ' deep (x3) primitive additions...');
	started = performance.now();
	for (let i = 0; i < mutationIterations; i++) {
		po.address.street[i] = i;
	}
	ended = performance.now();
	if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
	if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
	console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');

	//	removing new property
	changesCountA = 0;
	changesCountB = 0;
	console.info('performing ' + mutationIterations + ' deep (x3) primitive deletions...');
	started = performance.now();
	for (let i = 0; i < mutationIterations; i++) {
		delete po.address.street[i];
	}
	ended = performance.now();
	if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
	if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
	console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');
});

suite.runTest({ name: 'push 100,000 observables to an array, mutate them and pop them back' }, () => {
	const
		mutationIterations = 100000,
		o = {
			name: 'Anna Guller',
			accountCreated: new Date(),
			age: 20,
			address: {
				city: 'Dreamland',
				street: {
					name: 'Hope',
					apt: 123
				}
			},
			orders: []
		},
		orders = [
			{ id: 1, description: 'some description', sum: 1234, date: new Date() },
			{ id: 2, description: 'some description', sum: 1234, date: new Date() },
			{ id: 3, description: 'some description', sum: 1234, date: new Date() }
		];
	let changesCountA,
		changesCountB,
		started,
		ended;

	//	creation of Observable
	const po = Observable.from({ users: [] });

	//	add listeners/callbacks
	po.observe(changes => {
		if (!changes.length) throw new Error('expected to have at least one change in the list');
		else changesCountA += changes.length;
	});
	po.observe(changes => {
		if (!changes) throw new Error('expected changes list to be defined');
		else changesCountB += changes.length;
	});

	//	push objects
	changesCountA = 0;
	changesCountB = 0;
	console.info('performing ' + mutationIterations + ' objects pushes...');
	started = performance.now();
	for (let i = 0; i < mutationIterations; i++) {
		po.users.push(o);
	}
	ended = performance.now();
	if (po.users.length !== mutationIterations) throw new Error('expected to have total of ' + mutationIterations + ' elements in pushed array, but got ' + po.length);
	if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
	if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
	console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');

	//	add orders array to each one of them
	changesCountA = 0;
	changesCountB = 0;
	console.info('performing ' + mutationIterations + ' additions of arrays onto the objects...');
	started = performance.now();
	for (let i = 0; i < mutationIterations; i++) {
		po.users[i].orders = orders;
	}
	ended = performance.now();
	if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
	if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
	console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');

	//	pop objects
	changesCountA = 0;
	changesCountB = 0;
	console.info('performing ' + mutationIterations + ' object pops...');
	started = performance.now();
	for (let i = 0; i < mutationIterations; i++) {
		po.users.pop();
	}
	ended = performance.now();
	if (po.users.length !== 0) throw new Error('expected to have total of 0 elements in pushed array, but got ' + po.length);
	if (changesCountA !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted A, but got ' + changesCountA);
	if (changesCountB !== mutationIterations) throw new Error('expected to have ' + mutationIterations + ' changes counted B, but got ' + changesCountB);
	console.info('\tdone: total time - ' + (ended - started) + 'ms, average operation time: ' + Math.round((ended - started) / mutationIterations * 10000) / 10000 + 'ms');
});