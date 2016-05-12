# Summary

Observation of a changes performed on any arbitrary object (array being subtype of it, of course) is a **MUST HAVE** facility in JavaScript world (i'd say in any environment in general and in those providing GUI especially).

Native facility would be the best solution for this, since it may provide non-intrusive observation wihtout actual 'touch' of the original objects, but seems like spec is not yet mature enough for that.

Present library attempts to provide this functionality in a most clean (from consumption/API perspective) and performant way. Main aspects:
- Implementation relies on __Proxy__ mechanism
- Observation is 'deep', yielding changes from a __sub-graphs__ too
- Changes delivered in a __synchronous__ way
- Changes delivered always as an __array__, in order to have unified callback API signature supporting future bulk changes delivery in a single call back
- Original objects are '__intrumented__', thus requiring few basic steps in a consumption flow
  - first, create observable clone from the specified object
  - second, register observers on the observable (not on the original object)

# Loading the Library

You have 2 ways to load the library: into a 'window' global scope, or a custom scope provided by you.

* Simple a reference (script tag) to the object-oserver.js in your HTML will load it into the __global scope__:
```html
<script src="object-observer.js"></script>
<script>
	var person = { name: 'some name' },
	    observablePerson;
	observablePerson = ObjectObserver.observableFrom(person);
</script>
```

* Following loader exemplifies how to load the library into a __custom scope__ (add error handling as appropriate):
```javascript
var customNamespace = {},
    person = { name: 'some name' },
    observablePerson;

fetch('object-observer.js').then(function (response) {
	if (response.status === 200) {
		response.text().then(function (code) {
			Function(code).call(customNamespace);
			
			//	the below code is an example of consumption, locate it in your app lifecycle/flow as appropriate
			observablePerson = customNamespace.ObjectObserver.observableFrom(person);
		});
	}
});
```

# API

##### _ObjectObserver_ service APIs:

- `observableFrom` - receives a __non-null object__ and returns __Observable__
	```javascript
	var person = { name: 'Nava', age: '6' },
		observablePerson;

	observablePerson = ObjectObserver.observableFrom(person);
	...
	```

##### _Observable_ APIs

- `observe` - receives a function, which will be added to the list of observers subscribed for a changes of this observable
	```javascript
	function personUIObserver(changes) {
		changes.forEach(change => {
			console.log(change.type);
			console.log(change.path);
			console.log(change.value);
			console.log(change.oldValue);
		});
	}
	...
	observablePerson = ObjectObserver.observableFrom(person);
	observablePerson.observe(personUIObserver);
	```
- `unobserve` - receives a function/s which previously was/were registered as an observer/s and removes it/them
				If no parameter/s passed, all observers will be removed
	```javascript
	...
	observablePerson.unobserve(personUIObserver);
	...
	observablePerson.unobserve();
	...
	```

# More examples / code snippets

TODO
