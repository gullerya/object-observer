# Architecture

```mermaid
classDiagram
    class ObservableBase {
        
    }

    ObservableBase <|-- ObservableObject
    ObservableBase <|-- ObservableArray
    ObservableBase <|-- ObservableTypedArray
```