# Filter paths options

`<observable instance>.observe(...)` allows `options` parameter, second one, optional.

Some of the options are filtering ones, allowing to specify the changes of interest within the whole observable graph. Here is a detailed description of those options.

__`pathsFrom`__

non-empty string, any changes from the specified path and deeper will be delivered to the observer; this option MAY NOT be used together with `path` option

![paths from](./filter-graphs/filter-paths-from.svg)

__`pathsOf`__

string, MAY be empty; direct properties of the specified path will be notified

![paths of](./filter-graphs/filter-paths-of.svg)

__`path`__

non-empty string; specific path to observe, only a changes of this exact path will be notified

![paths](./filter-graphs/filter-paths.svg)
