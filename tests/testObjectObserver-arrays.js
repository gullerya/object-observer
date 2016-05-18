(function () {
    'use strict';

    var suite = window.Utils.JustTest.createSuite({ name: 'Testing ObjectObserver - arrays' });

    suite.addTest({ name: 'array push operation - primitive' }, function (pass, fail) {
        var a = [1, 2, 3, 4],
			pa,
			events = [],
			callBacks = 0;
        pa = ObjectObserver.observableFrom(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
            callBacks++;
        });

        pa.push(5);
        pa.push(6, 7);

        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (callBacks !== 2) fail('expected to have 2 callbacks, found ' + callBacks);
        if (events[0].type !== 'insert' || events[0].path !== '[4]' || events[0].value !== 5) fail('event 0 did not fire as expected');
        if (events[1].type !== 'insert' || events[1].path !== '[5]' || events[1].value !== 6) fail('event 0 did not fire as expected');
        if (events[2].type !== 'insert' || events[2].path !== '[6]' || events[2].value !== 7) fail('event 0 did not fire as expected');

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
        if (events[0].type !== 'insert' || events[0].path !== '[0]' || events[0].value.text !== 'initial') fail('event 0 did not fire as expected');

        pa[0].text = 'name';
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[1].type !== 'update' || events[1].path !== '[0].text' || events[1].value !== 'name' || events[1].oldValue !== 'initial') fail('event 1 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array pop operation' }, function (pass, fail) {
        var a = ['some'],
			pa,
			popped,
			events = [];
        pa = ObjectObserver.observableFrom(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        popped = pa.pop();

        if (events.length < 1) fail('expected to have at least 1 event, found ' + events.length);
        if (events[0].type !== 'delete' || events[0].path !== '[0]' || events[0].oldValue !== 'some') fail('event 0 did not fire as expected');
        if (popped !== 'some') fail('pop base functionality broken');

        pass();
    });

    suite.addTest({ name: 'array unshift operation - primitive' }, function (pass, fail) {
        var a = [],
			pa,
			events = [],
			callBacks = 0;
        pa = ObjectObserver.observableFrom(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
            callBacks++;
        });

        pa.unshift('a');
        pa.unshift('b', 'c');
        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (callBacks !== 2) fail('expected to have 2 callbacks, found ' + callBacks);
        if (events[0].type !== 'insert' || events[0].path !== '[0]' || events[0].value !== 'a') fail('event 0 did not fire as expected');
        if (events[1].type !== 'insert' || events[1].path !== '[0]' || events[1].value !== 'b') fail('event 1 did not fire as expected');
        if (events[2].type !== 'insert' || events[2].path !== '[1]' || events[2].value !== 'c') fail('event 2 did not fire as expected');

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
        if (events[0].type !== 'insert' || events[0].path !== '[0]' || events[0].value.text !== 'initial') fail('event 0 did not fire as expected');

        pa[0].text = 'name';
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[1].type !== 'update' || events[1].path !== '[0].text' || events[1].value !== 'name' || events[1].oldValue !== 'initial') fail('event 1 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array shift operation' }, function (pass, fail) {
        var a = ['some'],
			pa,
			shifted,
			events = [];
        pa = ObjectObserver.observableFrom(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        shifted = pa.shift();

        if (events.length < 1) fail('expected to have at least 1 event, found ' + events.length);
        if (events[0].type !== 'delete' || events[0].path !== '[0]' || events[0].oldValue !== 'some' || events[0].newValue) fail('event 0 did not fire as expected');
        if (shifted !== 'some') fail('shift base functionality broken');

        pass();
    });

    suite.addTest({ name: 'array reverse operation' }, function (pass, fail) {
        var a = [1, 2, 3],
			pa,
            reversed,
			events = [];
        pa = ObjectObserver.observableFrom(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        reversed = pa.reverse();

        if (events.length !== 1) fail('expected to have at least 1 event, found ' + events.length);
        if (events[0].type !== 'reverse') fail('event 0 did not fire as expected');
        if (reversed !== pa) fail('reverse base functionality broken');
        if (pa[0] !== 3 || pa[1] !== 2 || pa[2] !== 1) fail('reverse base functionality broken');

        pass();
    });

    suite.run();
})();