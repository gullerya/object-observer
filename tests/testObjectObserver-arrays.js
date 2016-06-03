(function () {
    'use strict';

    var suite = window.Utils.JustTest.createSuite({ name: 'Testing ObjectObserver - arrays' });

    suite.addTest({ name: 'array push operation - primitives' }, function (pass, fail) {
        var a = [1, 2, 3, 4],
			pa,
			events = [],
			callBacks = 0;
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
            callBacks++;
        });

        pa.push(5);
        pa.push(6, 7);

        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (callBacks !== 2) fail('expected to have 2 callbacks, found ' + callBacks);
        if (events[0].type !== 'insert' || events[0].path.join('.') !== '4' || events[0].value !== 5) fail('event 0 did not fire as expected');
        if (events[1].type !== 'insert' || events[1].path.join('.') !== '5' || events[1].value !== 6) fail('event 0 did not fire as expected');
        if (events[2].type !== 'insert' || events[2].path.join('.') !== '6' || events[2].value !== 7) fail('event 0 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array push operation - objects' }, function (pass, fail) {
        var a = [],
			pa,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        pa.push({ text: 'initial' });
        if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
        if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value.text !== 'initial') fail('event 0 did not fire as expected');

        pa[0].text = 'name';
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[1].type !== 'update' || events[1].path.join('.') !== '0.text' || events[1].value !== 'name' || events[1].oldValue !== 'initial') fail('event 1 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array pop operation' }, function (pass, fail) {
        var a = ['some'],
			pa,
			popped,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        popped = pa.pop();

        if (events.length < 1) fail('expected to have at least 1 event, found ' + events.length);
        if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue !== 'some') fail('event 0 did not fire as expected');
        if (popped !== 'some') fail('pop base functionality broken');

        pass();
    });

    suite.addTest({ name: 'array unshift operation - primitives' }, function (pass, fail) {
        var a = [],
			pa,
			events = [],
			callBacks = 0;
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
            callBacks++;
        });

        pa.unshift('a');
        pa.unshift('b', 'c');
        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (callBacks !== 2) fail('expected to have 2 callbacks, found ' + callBacks);
        if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value !== 'a') fail('event 0 did not fire as expected');
        if (events[1].type !== 'insert' || events[1].path.join('.') !== '0' || events[1].value !== 'b') fail('event 1 did not fire as expected');
        if (events[2].type !== 'insert' || events[2].path.join('.') !== '1' || events[2].value !== 'c') fail('event 2 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array unshift operation - objects' }, function (pass, fail) {
        var a = [{ text: 'original' }],
			pa,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        pa.unshift({ text: 'initial' });
        if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
        if (events[0].type !== 'insert' || events[0].path.join('.') !== '0' || events[0].value.text !== 'initial') fail('event 0 did not fire as expected');
        events.splice(0);

        pa[0].text = 'name';
        pa[1].text = 'other';
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '0.text' || events[0].value !== 'name' || events[0].oldValue !== 'initial') fail('event 0 did not fire as expected');
        if (events[1].type !== 'update' || events[1].path.join('.') !== '1.text' || events[1].value !== 'other' || events[1].oldValue !== 'original') fail('event 1 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array shift operation - primitives' }, function (pass, fail) {
        var a = ['some'],
			pa,
			shifted,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        shifted = pa.shift();

        if (events.length < 1) fail('expected to have at least 1 event, found ' + events.length);
        if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue !== 'some' || events[0].newValue) fail('event 0 did not fire as expected');
        if (shifted !== 'some') fail('shift base functionality broken');

        pass();
    });

    suite.addTest({ name: 'array shift operation - objects' }, function (pass, fail) {
        var a = [{ text: 'a' }, { text: 'b' }],
			pa,
			shifted,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        shifted = pa.shift();

        if (events.length < 1) fail('expected to have at least 1 event, found ' + events.length);
        if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue.text !== 'a') fail('event 0 did not fire as expected');
        if (shifted.text !== 'a') fail('shift base functionality broken');
        events.splice(0);

        pa[0].text = 'c';
        if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '0.text' || events[0].oldValue !== 'b' || events[0].value !== 'c') fail('event 0 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array reverse operation - primitives' }, function (pass, fail) {
        var a = [1, 2, 3],
			pa,
            reversed,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        reversed = pa.reverse();

        if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
        if (events[0].type !== 'reverse') fail('event 0 did not fire as expected');
        if (reversed !== pa) fail('reverse base functionality broken');
        if (pa[0] !== 3 || pa[1] !== 2 || pa[2] !== 1) fail('reverse base functionality broken');

        pass();
    });

    suite.addTest({ name: 'array reverse operation - objects' }, function (pass, fail) {
        var a = [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
			pa,
            reversed,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        pa[0].name = 'A';
        reversed = pa.reverse();
        pa[0].name = 'C';

        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '0.name' || events[0].value !== 'A' || events[0].oldValue !== 'a') fail('event 0 did not fire as expected');
        if (events[1].type !== 'reverse') fail('event 1 did not fire as expected');
        if (events[2].type !== 'update' || events[2].path.join('.') !== '0.name' || events[2].value !== 'C' || events[2].oldValue !== 'c') fail('event 2 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array sort operation - primitives' }, function (pass, fail) {
        var a = [3, 2, 1],
			pa,
            sorted,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        sorted = pa.sort();

        if (events.length !== 1) fail('expected to have 1 event, found ' + events.length);
        if (events[0].type !== 'shuffle') fail('event 0 did not fire as expected');
        if (sorted !== pa) fail('sort base functionality broken');
        if (pa[0] !== 1 || pa[1] !== 2 || pa[2] !== 3) fail('sort base functionality broken');

        sorted = pa.sort((a, b) => { return a < b; });
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[1].type !== 'shuffle') fail('event 1 did not fire as expected');
        if (sorted !== pa) fail('sort base functionality broken');
        if (pa[0] !== 3 || pa[1] !== 2 || pa[2] !== 1) fail('sort base functionality broken');

        pass();
    });

    suite.addTest({ name: 'array sort operation - objects' }, function (pass, fail) {
        var a = [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
			pa,
            sorted,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        pa[0].name = 'A';
        sorted = pa.sort((a, b) => { return a.name < b.name; });
        pa[0].name = 'C';

        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '0.name' || events[0].value !== 'A' || events[0].oldValue !== 'a') fail('event 0 did not fire as expected');
        if (events[1].type !== 'shuffle') fail('event 1 did not fire as expected');
        if (events[2].type !== 'update' || events[2].path.join('.') !== '0.name' || events[2].value !== 'C' || events[2].oldValue !== 'c') fail('event 2 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array fill operation - primitives' }, function (pass, fail) {
        var a = [1, 2, 3],
			pa,
            filled,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        filled = pa.fill('a');
        if (filled !== pa) fail('fill base functionality broken');
        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '0' || events[0].value !== 'a' || events[0].oldValue !== 1) fail('event 0 did not fire as expected');
        if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value !== 'a' || events[1].oldValue !== 2) fail('event 1 did not fire as expected');
        if (events[2].type !== 'update' || events[2].path.join('.') !== '2' || events[2].value !== 'a' || events[2].oldValue !== 3) fail('event 2 did not fire as expected');
        events.splice(0);

        pa.fill('b', 1, 3);
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value !== 'b' || events[0].oldValue !== 'a') fail('event 0 did not fire as expected');
        if (events[1].type !== 'update' || events[1].path.join('.') !== '2' || events[1].value !== 'b' || events[1].oldValue !== 'a') fail('event 1 did not fire as expected');
        events.splice(0);

        pa.fill('c', -1, 3)
        if (events.length !== 1) fail('expected to have 1 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '2' || events[0].value !== 'c' || events[0].oldValue !== 'b') fail('event 0 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array fill operation - objects' }, function (pass, fail) {
        var a = [1, 2, 3],
			pa,
            filled,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        filled = pa.fill({ name: 'Niv' });
        if (filled !== pa) fail('fill base functionality broken');
        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '0' || events[0].value.name !== 'Niv' || events[0].oldValue !== 1) fail('event 0 did not fire as expected');
        if (events[1].type !== 'update' || events[1].path.join('.') !== '1' || events[1].value.name !== 'Niv' || events[1].oldValue !== 2) fail('event 1 did not fire as expected');
        if (events[2].type !== 'update' || events[2].path.join('.') !== '2' || events[2].value.name !== 'Niv' || events[2].oldValue !== 3) fail('event 2 did not fire as expected');
        events.splice(0);

        pa[1].name = 'David';
        if (events.length !== 1) fail('expected to have 1 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '1.name' || events[0].value !== 'David' || events[0].oldValue !== 'Niv') fail('event 0 did not fire as expected');

        pass();
    });

    suite.addTest({ name: 'array splice operation - primitives' }, function (pass, fail) {
        var a = [1, 2, 3, 4, 5, 6],
			pa,
            spliced,
			events = [],
            callbacks = 0;
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
            callbacks++;
        });

        spliced = pa.splice(2, 2, 'a');
        if (!Array.isArray(spliced) || spliced.length !== 2 || spliced[0] !== 3 || spliced[1] !== 4) fail('splice base functionality broken');
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (callbacks !== 1) fail('expected to have 1 callback, found ' + callbacks);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '2' || events[0].value !== 'a' || events[0].oldValue !== 3) fail('event 0 did not fire as expected');
        if (events[1].type !== 'delete' || events[1].path.join('.') !== '3' || events[1].oldValue !== 4) fail('event 1 did not fire as expected');
        events.splice(0);
        callbacks = 0;

        //  pa = [1,2,'a',5,6]
        spliced = pa.splice(-3);
        if (events.length !== 3) fail('expected to have 3 events, found ' + events.length);
        if (callbacks !== 1) fail('expected to have 1 callback, found ' + callbacks);
        if (events[0].type !== 'delete' || events[0].path.join('.') !== '2' || events[0].oldValue !== 'a') fail('event 0 did not fire as expected');
        if (events[1].type !== 'delete' || events[1].path.join('.') !== '3' || events[1].oldValue !== 5) fail('event 1 did not fire as expected');
        if (events[2].type !== 'delete' || events[2].path.join('.') !== '4' || events[2].oldValue !== 6) fail('event 2 did not fire as expected');
        events.splice(0);
        callbacks = 0;

        //  pa = [1,2]
        spliced = pa.splice(0);
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (callbacks !== 1) fail('expected to have 1 callback, found ' + callbacks);
        if (events[0].type !== 'delete' || events[0].path.join('.') !== '0' || events[0].oldValue !== 1) fail('event 0 did not fire as expected');
        if (events[1].type !== 'delete' || events[1].path.join('.') !== '1' || events[1].oldValue !== 2) fail('event 1 did not fire as expected');
        events.splice(0);
        callbacks = 0;

        pass();
    });

    suite.addTest({ name: 'array splice operation - objects' }, function (pass, fail) {
        var a = [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
			pa,
            spliced,
			events = [];
        pa = Observable.from(a);
        pa.observe(function (eventsList) {
            [].push.apply(events, eventsList);
        });

        pa.splice(1, 2, { text: '1' });
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '1' || events[0].value.text !== '1' || events[0].oldValue.text !== 'b') fail('event 0 did not fire as expected');
        if (events[1].type !== 'delete' || events[1].path.join('.') !== '2' || events[1].oldValue.text !== 'c') fail('event 1 did not fire as expected');
        events.splice(0);

        pa[1].text = 'B';
        pa[2].text = 'D';
        if (events.length !== 2) fail('expected to have 2 events, found ' + events.length);
        if (events[0].type !== 'update' || events[0].path.join('.') !== '1.text' || events[0].value !== 'B' || events[0].oldValue !== '1') fail('event 0 did not fire as expected');
        if (events[1].type !== 'update' || events[1].path.join('.') !== '2.text' || events[1].value !== 'D' || events[1].oldValue !== 'd') fail('event 1 did not fire as expected');

        pass();
    });

    suite.run();
})();