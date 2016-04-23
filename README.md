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

# API

Assuming

# Loading

You have 2 ways to load the library: into a 'window' global scope, or a custom scope provided by you
1. Adding a refernce (script tag) to the object-oserver.js in your HTML:
`<script src="object-observer.js"></script>`



# Examples

TODO
