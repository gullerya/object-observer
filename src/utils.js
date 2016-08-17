function iterate(graph, result, path) {
	var tmp, pVal;
	if (Array.isArray(graph)) {
		tmp = path + '[';
		graph.forEach(function (itm, idx) {
			if (itm && typeof itm === 'object') {
				iterate(itm, result, [tmp, idx, ']'].join(''));
			} else {
				result[[tmp, idx, ']'].join('')] = itm;
			}
		});
	} else {
		tmp = path ? path + '.' : '';
		Reflect.ownKeys(graph).forEach(function (pKey) {
			pVal = graph[pKey];
			if (pVal && typeof pVal === 'object') {
				iterate(pVal, result, tmp + pKey);
			} else {
				result[tmp + pKey] = pVal;
			}
		});
	}
}

function flattenObject(graph) {
	var result = {};
	if (typeof graph !== 'object') { throw new Error('illegal graph argument, object expected'); }
	if (graph) { iterate(graph, result, ''); }
	return result;
}
