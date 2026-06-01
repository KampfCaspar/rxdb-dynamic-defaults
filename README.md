# rxdb-dynamic-defaults

Dynamic Defaults Plugin for [RxDB](https://rxdb.info/).

## What it does

RxDB's schema `default` values are static. This plugin lets you assign defaults that are computed at insert time — per field or for the whole document.

## Install

```sh
npm install @kampfcaspar/rxdb-dynamic-defaults
```

RxDB `^17.3` is required as peer dependency. 
As it fixes a bug with composite primary keys being checked before pre-insert hooks are called. 

## Usage

Import and register the plugin once:

```ts
import { addRxPlugin } from 'rxdb';
import { DynamicDefaultsPlugin } from '@kampfcaspar/rxdb-dynamic-defaults';

addRxPlugin(DynamicDefaultsPlugin);
```

Then configure `dynamicDefaults` in your collection options:

### Static defaults per field

```ts
collection: {
  schema: mySchema,
  options: {
    dynamicDefaults: {
      name: 'default name',
      age: 10
    }
  }
}
```

### Dynamic defaults per field

```ts
collection: {
  schema: mySchema,
  options: {
    dynamicDefaults: {
      createdAt: () => new Date().toISOString(),
      fullName: (doc) => `${doc.firstName} ${doc.lastName}`,
      slug: (doc, collection, key) => doc.title.toLowerCase().replace(/\s+/g, '-')
    }
  }
}
```

### Document-level default callback

```ts
collection: {
  schema: mySchema,
  options: {
    dynamicDefaults: (doc, collection) => {
      doc.createdAt ??= new Date().toISOString();
      doc.id ??= crypto.randomUUID();
    }
  }
}
```

## Behavior

- Defaults are only applied when a field is absent or `undefined`.
- Schema `default` values run first; `dynamicDefaults` are applied afterwards.
- Callbacks receive the document being inserted, the collection, and (for field-level) the property key.

## License

AGPL-3.0-or-later
