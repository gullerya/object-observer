# Summary

Observating a changes performed on any arbitrary object (array being subtype of it, of course) is a MUST HAVE facility in JavaScript world (i'd say in any environment in general and in those providing GUI espesially).

Native facility would be the best solution for this, since it may provide non-intrusive observation wihtout actual 'touch' of the original objects, but seems like spec is not yet mature enough for that.

Present library attempts to provide this functionality in a most clean (from consumption/API perspective) and performant way. Main aspects:
- Implementation relies on Proxy facility
- Observation is 'deep', yielding changes from a sub-graphs too
- Changes delivered in a synchronous way
- Original object are being 'intrumented', thus requiring one more step in a consumption flow
  - first, create observable clone from the specified object
  - second, register observers on that observable (not on the original one)

# Loading the Library

You have 2 ways to load the library: into a 'window' global scope, or a custom scope provided by you

* Simple a reference (script tag) to the object-oserver.js in your HTML:
```html
<script src="object-observer.js"></script>
<script>
	var person = { name: 'some name' },
	    observablePerson;
	observablePerson = ObjectObserver.createObservable(person);
</script>
```

* Custom loader with custom namespace, if you want to keep global scope clean (add your error handling as appropriate):
```javascript
var customNamespace = {},
    person = { name: 'some name' },
    observablePerson;

fetch('object-observer.js').then(function (response) {
	if (response.status === 200) {
		response.text().then(function (code) {
			Function(code).call(customNamespace);
			
			//	the below code is an example of consumption, locate is in your app lifecycle as needed
			observablePerson = customNamespace.ObjectObserver.observe();
		});
	}
});
```

# API

TODO


# Examples

TODO
