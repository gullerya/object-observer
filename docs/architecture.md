# Architecture

At its core, `object-observer` takes a userland object graph and hands back a `Proxy`-wrapped clone (the `Observable`). From that point on, consumers interact **only with the observable**; the original target stays internal. Every mutation on the observable is intercepted by the `Proxy` traps, turned into one or more `Change` events, and dispatched to the registered observers.

```mermaid
flowchart LR
    user["userland code"]

    subgraph src["input"]
        target["plain object / array /<br/>typed array (target)"]
    end

    subgraph lib["object-observer"]
        direction TB
        proxy["Proxy (returned as Observable)"]
        meta["oMeta<br/>(target ref, parent,<br/>observers, validators)"]
        traps["Proxy traps<br/>set / deleteProperty /<br/>intrinsic methods"]
        proxy -.- meta
        proxy --> traps
    end

    observers["observer callbacks"]

    user -- "Observable.from(target)" --> target
    target -- "cloned & wrapped" --> proxy
    proxy -- "returned to user" --> user
    user -- "mutates the observable" --> proxy
    traps -- "Change[] dispatch" --> observers
    user -- "Observable.observe(obs, cb)" --> observers
```

The returned `Observable` is deep: nested objects are themselves observables, sharing the same dispatch pipeline. Mutations anywhere in the graph bubble up through the parent chain so root-level observers see the full rooted path.
