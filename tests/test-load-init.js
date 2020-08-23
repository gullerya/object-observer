import { getSuite } from '../../node_modules/just-test/dist/just-test.js';
import { Observable } from '../../dist/object-observer.js';

const suite = getSuite({ name: 'Testing loading/initialization flavors' });

suite.runTest({ name: 'test A - regular script import' }, test => {
	test.assertEqual(typeof Observable, 'function');
});