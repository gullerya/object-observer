(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Flattening Object' }),
		observer = new DataObserver(),
		data = {
			string: 'some',
			number: 669847,
			boolean: true,
			nullified: null,
			objectLevel1: {
				string: 'some',
				number: 669847,
				boolean: true,
				nullified: null,
				objectLevel2: {
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					objectLevel3: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
					}
				}
			},
			array: [
				{
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					object: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
						object: {
							string: 'some',
							number: 669847,
							boolean: true,
							nullified: null
						}
					}
				},
				{
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					object: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
						object: {
							string: 'some',
							number: 669847,
							boolean: true,
							nullified: null
						}
					}
				},
				{
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					object: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
						object: {
							string: 'some',
							number: 669847,
							boolean: true,
							nullified: null
						}
					}
				}
			]
		};

	suite.addTest({ name: 'test A - object' }, function (pass, fail) {
		var flat;

		flat = flatten(data);

		if (flat['string'] !== 'some') fail(1);
		if (flat['number'] !== 669847) fail(2);
		if (flat['boolean'] !== true) fail(3);
		if (flat['nullified'] !== null) fail(4);
		if (flat['objectLevel1.string'] !== 'some') fail(5);
		if (flat['objectLevel1.number'] !== 669847) fail(6);
		if (flat['objectLevel1.boolean'] !== true) fail(7);
		if (flat['objectLevel1.nullified'] !== null) fail(8);
		if (flat['objectLevel1.objectLevel2.string'] !== 'some') fail(9);
		if (flat['objectLevel1.objectLevel2.number'] !== 669847) fail(10);
		if (flat['objectLevel1.objectLevel2.boolean'] !== true) fail(11);
		if (flat['objectLevel1.objectLevel2.nullified'] !== null) fail(12);
		if (flat['objectLevel1.objectLevel2.objectLevel3.string'] !== 'some') fail(13);
		if (flat['objectLevel1.objectLevel2.objectLevel3.number'] !== 669847) fail(14);
		if (flat['objectLevel1.objectLevel2.objectLevel3.boolean'] !== true) fail(15);
		if (flat['objectLevel1.objectLevel2.objectLevel3.nullified'] !== null) fail(16);

		//	TODO: add assertions for array

		pass();
	});

	suite.addTest({ name: 'test B - array' }, function (pass, fail) {
		var dataArray = [], counter = 20, flat, arrayPrefix;

		while (counter--) {
			dataArray.push(data);
		}
		flat = flatten(dataArray);

		for (var i = 0; i < counter; i++) {
			arrayPrefix = '[' + i + '].';
			if (flat[arrayPrefix + 'string'] !== 'some') fail();
			if (flat[arrayPrefix + 'number'] !== 669847) fail();
			if (flat[arrayPrefix + 'boolean'] !== true) fail();
			if (flat[arrayPrefix + 'nullified'] !== null) fail();
			if (flat[arrayPrefix + 'objectLevel1.string'] !== 'some') fail();
			if (flat[arrayPrefix + 'objectLevel1.number'] !== 669847) fail();
			if (flat[arrayPrefix + 'objectLevel1.boolean'] !== true) fail();
			if (flat[arrayPrefix + 'objectLevel1.nullified'] !== null) fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.string'] !== 'some') fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.number'] !== 669847) fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.boolean'] !== true) fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.nullified'] !== null) fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.objectLevel3.string'] !== 'some') fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.objectLevel3.number'] !== 669847) fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.objectLevel3.boolean'] !== true) fail();
			if (flat[arrayPrefix + 'objectLevel1.objectLevel2.objectLevel3.nullified'] !== null) fail();
		}

		pass();
	});

	suite.run();
})();