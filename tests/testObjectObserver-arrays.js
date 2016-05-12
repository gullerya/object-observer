(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing ObjectObserver - arrays' });

	suite.addTest({ name: 'array push operation - primitive' }, function (pass, fail) {
		var a = [1, 2, 3, 4],
			pa,
			events = [];
		pa = ObjectObserver.observableFrom(a);
		pa.observe(function (eventsList) {
			[].push.apply(events, eventsList);
		});

		pa.push(5);
		pa.push(6, 7);

		if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
		if (events[0].path !== '[4]' || events[0].value !== 5) fail('event 0 did not fire as expected');
		if (events[1].path !== '[5]' || events[1].value !== 6) fail('event 0 did not fire as expected');
		if (events[2].path !== '[6]' || events[2].value !== 7) fail('event 0 did not fire as expected');

		pass();
	});

	suite.addTest({ name: 'array push operation - objects' }, function (pass, fail) {
		var a = [],
			pa,
			events = [];
		pa = ObjectObserver.observableFrom(a);
		pa.observe(function (eventsList) {
			[].push.apply(events, eventsList);
		});

		pa.push({ text: 'initial' });
		if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
		if (events[0].path !== '[0]' || events[0].value.text !== 'initial') fail('event 0 did not fire as expected');

		pa[0].text = 'name';
		if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
		if (events[1].path !== '[0].text' || events[1].value !== 'name' || events[1].oldValue !== 'initial') fail('event 1 did not fire as expected');

		pass();
	});

	suite.addTest({ name: 'array pop operation' }, function (pass, fail) {
		var a = ['some'],
			pa,
			events = [];
		pa = ObjectObserver.observableFrom(a);
		pa.observe(function (eventsList) {
			[].push.apply(events, eventsList);
		});

		pa.pop();

		if (events.length < 1) fail('expected to have at least 1 event, found ' + events.length);
		if (events[0].path !== '[0]' || events[0].oldValue !== 'some') fail('event 0 did not fire as expected');

		pass();
	});

	suite.addTest({ name: 'array unshift operation - primitive' }, function (pass, fail) {
		var a = [],
			pa,
			events = [];
		pa = ObjectObserver.observableFrom(a);
		pa.observe(function (eventsList) {
			[].push.apply(events, eventsList);
		});

		pa.unshift('a');
		pa.unshift('b', 'c');
		if (events.length !== 4) fail('expected to have 3 event, found ' + events.length);
		if (events[0].path !== '[0]' || events[0].value !== 'a') fail('event 0 did not fire as expected');
		if (events[1].path !== '[2]' || events[1].value !== 'a') fail('event 1 did not fire as expected');
		if (events[2].path !== '[0]' || events[2].value !== 'b' || events[2].oldValue !== 'a') fail('event 1 did not fire as expected');
		if (events[3].path !== '[1]' || events[3].value !== 'c') fail('event 2 did not fire as expected');

		pass();
	});

	suite.addTest({ name: 'array unshift operation - objects' }, function (pass, fail) {
		var a = [],
			pa,
			events = [];
		pa = ObjectObserver.observableFrom(a);
		pa.observe(function (eventsList) {
			[].push.apply(events, eventsList);
		});

		pa.unshift({ text: 'initial' });
		if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
		if (events[0].path !== '[0]' || events[0].value.text !== 'initial') fail('event 0 did not fire as expected');

		pa[0].text = 'name';
		if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
		if (events[1].path !== '[0].text' || events[1].value !== 'name' || events[1].oldValue !== 'initial') fail('event 1 did not fire as expected');

		pass();
	});

	suite.addTest({ name: 'array shift operation' }, function (pass, fail) {
		var a = ['some'],
			pa,
			events = [];
		pa = ObjectObserver.observableFrom(a);
		pa.observe(function (eventsList) {
			[].push.apply(events, eventsList);
		});

		pa.shift();

		if (events.length < 1) fail('expected to have at least 1 event, found ' + events.length);
		if (events[0].path !== '[0]' || events[0].oldValue !== 'some' || events[0].newValue) fail('event 0 did not fire as expected');

		pass();
	});

	suite.run();
})();