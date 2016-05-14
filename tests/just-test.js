(function (options) {
	'use strict';

	var view, api = {}, consts = {}, utils = {}, suites = [], suitesQueue = Promise.resolve();

	if (!options || typeof options !== 'object') { options = {}; }
	if (!options.namespace || typeof options.namespace !== 'object') {
		if (typeof window.Utils !== 'object') Object.defineProperty(window, 'Utils', { value: {} });
		options.namespace = window.Utils;
	}
	if (!('configUrl' in options)) options.configUrl = 'config.js';

	//	TODO: provide customizaton for the default values via the options
	Object.defineProperties(consts, {
		DEFAULT_SUITE_NAME: { value: 'unnamed' },
		DEFAULT_SYNC_TEST_TTL: { value: 10 * 1000 },
		DEFAULT_ASYNC_TEST_TTL: { value: 30 * 60 * 1000 }
	});

	function stringifyDuration(d) {
		if (d > 99) return (d / 1000).toFixed(1) + ' s';
		else if (d > 59900) return (d / 60000).toFixed(1) + ' m';
		else return d.toFixed(1) + ' ms';
	}

	function Assert(assertsAPI) {
		//	TODO: instead of test provide testAssertsAPI and count the asserts inside the test
		Object.defineProperties(this, {
			equal: {
				value: function (a, b) {
					if (a != b) {
						assertsAPI.failed++;
						throw new Error('Assert fail: ' + a + ' not equals ' + b);
					} else {
						assertsAPI.passed++;
					}
				}
			},
			striqual: {
				value: function (a, b) {
					if (a !== b) {
						assertsAPI.failed++;
						throw new Error('Assert fail: ' + a + ' not strictly equals ' + b);
					} else {
						assertsAPI.passed++;
					}
				}
			}
		});
	}

	function Utils(assertsAPI) {
		Object.defineProperties(this, {
			assert: { value: new Assert(assertsAPI) }
		});
	}

	function Test(options, testCode) {
		var id, name, async, skip, ttl, status = 'idle', message, startTime, beg, end, duration, view, asserts, tmp;
		id = 'id' in options ? options.id : undefined;
		name = 'name' in options ? options.name : 'not descripted';
		async = typeof options.async === 'boolean' ? options.async : false;
		skip = typeof options.skip === 'boolean' ? options.skip : false;
		ttl = typeof options.ttl === 'number' ? options.ttl : (async ? consts.DEFAULT_ASYNC_TEST_TTL : consts.DEFAULT_SYNC_TEST_TTL);

		view = document.createElement('div');
		view.className = 'test';

		tmp = document.createElement('div');
		tmp.className = 'title';
		tmp.textContent = name;
		view.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'duration';
		view.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'status ' + status;
		tmp.onclick = function () {
			var cntnt, msgEl = view.querySelector('.message');

			function trend() {
				this.classList.add('scrollable');
				this.removeEventListener('transitionend', trend);
			}

			if (status === 'idle' || status === 'running') return;
			if (msgEl.offsetHeight > 0) {
				msgEl.classList.remove('scrollable');
				msgEl.style.maxHeight = '0px';
			} else {
				msgEl.style.maxHeight = '200px';
				msgEl.addEventListener('transitionend', trend);
				if (message instanceof Error) {
					cntnt = message.stack.replace(' at ', '<br>')
					msgEl.innerHTML = cntnt;
				} else {
					msgEl.textContent = message ? message.toString() : '';
				}
			}
		};
		view.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'message';
		view.appendChild(tmp);

		asserts = {
			passed: 0,
			failed: 0
		};

		function run() {
			var testPromise, timeoutWatcher;
			status = 'running';
			view.querySelector('.status').className = 'status ' + status;

			function finalize(res, msg) {
				timeoutWatcher && clearInterval(timeoutWatcher);
				end = performance.now();
				message = msg;
				status = res;
				duration = end - beg;

				view.querySelector('.status').className = 'status ' + status;
				view.querySelector('.duration').textContent = stringifyDuration(duration);
				view.querySelector('.message').classList.add(status);
			}

			startTime = new Date();
			beg = performance.now();

			if (skip) {
				finalize('skipped', '');
				return Promise.resolve();
			} else {
				testPromise = new Promise(function (resolve, reject) {
					timeoutWatcher = setTimeout(function () {
						reject(new Error('Timeout, have you forgotten to call pass/fail?'));
					}, ttl);
					testCode(resolve, reject, new Utils(asserts));
				});
				testPromise.then(function (msg) { finalize('passed', msg); }, function (msg) {
					msg = msg instanceof Error ? msg : new Error(msg);
					finalize('failed', msg);
				});
				return testPromise;
			}
		}

		Object.defineProperties(this, {
			id: { get: function () { return id; } },
			name: { get: function () { return name; } },
			async: { get: function () { return async; } },
			skip: { get: function () { return skip; } },
			ttl: { get: function () { return ttl; } },
			run: { value: run },

			status: { get: function () { return status; } },
			message: { get: function () { return message; } },
			startTime: { get: function () { return startTime; } },
			duration: { get: function () { return duration; } },

			view: { get: function () { return view; } }
		});
	}

	function Suite(options) {
		var id, name, tests = [], passed = 0, failed = 0, skipped = 0, status = 'idle', startTime, beg, end, duration, view, tmp;
		options = typeof options === 'object' ? options : {};
		if ('id' in options) id = options.id;
		name = 'name' in options ? options.name : consts.DEFAULT_SUITE_NAME;

		view = document.createElement('div');
		view.className = 'suite';

		tmp = document.createElement('div');
		tmp.className = 'header';
		view.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'title';
		tmp.textContent = name;
		view.firstChild.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'counters';
		tmp.innerHTML = '<span class="passed">0</span> | <span class="failed">0</span> | <span class="skipped">0</span> of <span class="total">0</span>';
		view.firstChild.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'duration';
		view.firstChild.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'status ' + status;
		view.firstChild.appendChild(tmp);

		function updateCounters() {
			view.querySelector('.passed').textContent = passed;
			view.querySelector('.failed').textContent = failed;
			view.querySelector('.skipped').textContent = skipped;
		}

		function addTest(options, testCode) {
			var em = 'bad parameters: must be 1 or 2 where the last one is a function', test;
			if (arguments.length < 1 || arguments.length > 2) throw new Error(em);
			if (arguments.length === 1) {
				testCode = arguments[0];
				options = {};
			}
			if (typeof testCode !== 'function') { throw new Error(em); }
			test = new Test(options, testCode);
			view.appendChild(test.view);
			tests.push(test);
		}

		function run() {
			var suitePromise;
			status = 'running';
			view.querySelector('.header > .status').className = 'status ' + status;
			view.querySelector('.total').textContent = tests.length;

			function finalize() {
				end = performance.now();
				status = failed > 0 ? 'failed' : 'passed';
				duration = end - beg;

				view.querySelector('.header > .status').className = 'status ' + status;
				view.querySelector('.header > .duration').textContent = stringifyDuration(duration);
			}

			suitePromise = new Promise(function (resolve, reject) {
				var asyncFlow = Promise.resolve();

				startTime = new Date();
				beg = performance.now();

				(function iterate(index) {
					var test, testPromise;
					if (index === tests.length) {
						asyncFlow.then(function () { finalize(); resolve(); });
					} else {
						test = tests[index++];
						testPromise = test.run();
						testPromise.then(function () {
							if (test.status === 'passed') passed++;
							else if (test.status === 'failed') failed++;
							else if (test.status === 'skipped') skipped++;
							updateCounters();
							!test.async && iterate(index);
						}, function () {
							if (test.status === 'passed') passed++;
							else if (test.status === 'failed') failed++;
							else if (test.status === 'skipped') skipped++;
							updateCounters();
							!test.async && iterate(index);
						});
						if (test.async) {
							asyncFlow = asyncFlow.then(function () { return new Promise(function (r) { testPromise.then(r, r) }); });
							iterate(index);
						}
					}
				})(0);
			});

			return suitePromise;
		}

		Object.defineProperties(this, {
			id: { get: function () { return id; } },
			name: { get: function () { return name; } },

			view: { get: function () { return view; } },
			addTest: { value: addTest },
			getTests: { value: function () { return tests.slice(0); } },
			run: { value: run },

			status: { get: function () { return status; } },
			startTime: { get: function () { return startTime; } },
			duration: { get: function () { return duration; } }
		});
	}

	function buildView() {
		var css, jtUI, jtList, tmp, startX, startY, startLeft, startTop, tmpMMH, tmpMUH, state = 'max';

		function toggleMinMax(newState) {
			var b = jtUI.getElementsByClassName('minMaxToggle')[0];
			if (!newState) newState = state === 'min' ? 'max' : 'min';
			if (newState === 'max') {
				jtUI.classList.remove('min');
				jtUI.classList.add('max');
				b.textContent = '\u25b2';
				jtUI.lastChild.style.display = 'block';
			} else {
				jtUI.classList.remove('max');
				jtUI.classList.add('min');
				jtUI.lastChild.style.display = 'none';
				b.textContent = '\u25bc';
			}
			state = newState;
		}

		css = document.createElement('style');
		css.innerHTML += '.just-test-ui {position:fixed;top:50px;left:350px;background-color:#000;color:#fff;opacity:.7;font-size:20px;font-family:Courier;border-radius:5px;overflow:hidden;cursor:default;box-sizing:border-box;transition: width .2s, height .2s;z-index:99999;}';
		css.innerHTML += '.just-test-ui.max {height:800px;width:800px;}';
		css.innerHTML += '.just-test-ui.min {height:35px;width:180px;}';
		css.innerHTML += '.just-test-ui .title {position:absolute;font-family:Tahoma;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}';
		css.innerHTML += '.just-test-ui > .minMaxToggle {position:absolute;right:9px;top:3px;font:25px monospace;}';
		css.innerHTML += '.just-test-ui > .header {top:3px;height:40px;left:5px;right:40px;font-size:24px;color:#99f;}';
		css.innerHTML += '.just-test-ui > .content {position:absolute;top:40px;bottom:60px;width:100%;border-top:3px solid #99f;overflow-x:hidden;overflow-y:scroll;}';
		css.innerHTML += '.just-test-ui > .footer {position:absolute;bottom:0px;left:0px;width:100%;height:60px;padding:0px 5px;font-family:Tahoma;border-top:3px solid #99f;}';
		css.innerHTML += '.just-test-ui .suite {position:relative;width:100%;height:auto;margin:10px 0px 30px;}';
		css.innerHTML += '.just-test-ui .suite .header {position:relative;height:26px;margin:0px 5px;border-bottom:1px solid #555}';
		css.innerHTML += '.just-test-ui .suite .header > div {position:absolute;top:0px;}';
		css.innerHTML += '.just-test-ui .suite .header > .title {width:340px;}';
		css.innerHTML += '.just-test-ui .suite .header > .counters {left:350px;}';
		css.innerHTML += '.just-test-ui .suite .header > .status {right:0px;}';
		css.innerHTML += '.just-test-ui .scrollable {overflow-x:hidden;overflow-y:auto;}';
		css.innerHTML += '.just-test-ui .duration {right:100px;}';
		css.innerHTML += '.just-test-ui .running {color:#99f;}';
		css.innerHTML += '.just-test-ui .skipped {color:#666;}';
		css.innerHTML += '.just-test-ui .passed {color:#6f4;}';
		css.innerHTML += '.just-test-ui .failed {color:#f55;}';
		css.innerHTML += '.just-test-ui .status.idle:before {color:#fff;content:"idle";}';
		css.innerHTML += '.just-test-ui .status.running:before {content:"running";}';
		css.innerHTML += '.just-test-ui .status.skipped:before {content:"skipped";}';
		css.innerHTML += '.just-test-ui .status.passed:before {content:"passed";}';
		css.innerHTML += '.just-test-ui .status.failed:before {content:"failed";}';
		css.innerHTML += '.just-test-ui .test {position:relative;min-height:24px;margin:10px 5px 10px 30px;font-size:18px;overflow:hidden;}';
		css.innerHTML += '.just-test-ui .test > div {position:absolute;top:0px;}';
		css.innerHTML += '.just-test-ui .test > .title {left:3px;width:500px;}';
		css.innerHTML += '.just-test-ui .test > .status {right:3px;}';
		css.innerHTML += '.just-test-ui .test > .status.passed:hover, .just-test-ui .test > .status.failed:hover {border-bottom:1px solid #ccc;}';
		css.innerHTML += '.just-test-ui .test > .message {position:relative;margin:25px 0px 0px 40px;height:auto;max-height:0px;transition:max-height .2s;line-height:150%;}';

		document.body.appendChild(css);

		jtUI = document.createElement('div');
		jtUI.className = 'just-test-ui';

		tmp = document.createElement('div');
		tmp.className = 'header title';
		tmp.textContent = 'JustTest';
		tmp.onmousedown = function (event) {
			tmpMMH = document.onmousemove;
			tmpMUH = document.onmouseup;
			startX = event.clientX;
			startY = event.clientY;
			startLeft = jtUI.offsetLeft;
			startTop = jtUI.offsetTop;

			document.onmousemove = function (event) {
				var top = startTop + event.clientY - startY, left = startLeft + event.clientX - startX;
				top = top < 0 ? 0 : top;
				left = left < 0 ? 0 : left;
				top = document.documentElement.clientHeight - top - 35 < 0 ? document.documentElement.clientHeight - 35 : top;
				left = document.documentElement.clientWidth - left - 180 < 0 ? document.documentElement.clientWidth - 180 : left;
				jtUI.style.top = top + 'px';
				jtUI.style.left = left + 'px';
				event.preventDefault();
			};
			document.onmouseleave = document.onmouseup = function (event) {
				document.onmousemove = tmpMMH;
			};

		};
		jtUI.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'minMaxToggle';
		tmp.onclick = function () { toggleMinMax(); };
		jtUI.appendChild(tmp);

		jtList = document.createElement('div');
		jtList.className = 'content';
		jtUI.appendChild(jtList);

		tmp = document.createElement('div');
		tmp.className = 'footer';
		tmp.textContent = 'Summary:';
		jtUI.appendChild(tmp);

		toggleMinMax('max');
		document.body.appendChild(jtUI);

		return {
			ui: jtUI,
			appendSuiteView: function (v) { jtList.appendChild(v); }
		};
	}
	view = buildView();

	Object.defineProperties(api, {
		createSuite: {
			value: function (options) {
				var s = new Suite(options);
				suites.push(s);
				view.appendSuiteView(s.view);
				return s;
			}
		},
		View: { value: view }
	});
	Object.defineProperty(options.namespace, 'JustTest', { value: api });
})((typeof arguments === 'object' ? arguments[0] : undefined));