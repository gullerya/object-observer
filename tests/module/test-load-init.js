import { createSuite } from '../../node_modules/just-test/dist/just-test.min.js';
import { Observable } from '../../dist/object-observer.js';

const suite = createSuite({ name: 'Testing loading/initialization flavors' });

suite.runTest('test A - regular script import', test => {
	test.assertEqual(typeof Observable, 'function');
});