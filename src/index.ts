/*
 * Copyright (c) 2026 KampfCaspar <code@kampfcaspar.ch>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { RxCollection, RxCollectionCreator, RxPlugin } from "rxdb";

export type DynamicDefaultsCallback<T, K extends keyof T> = (doc?: T, collection?: RxCollection<T>, key?: K) => T[K];

export type DynamicDefaultsConfiguration<T> = {
	[K in keyof T]?: T[K] | DynamicDefaultsCallback<T, K>;
};

function preInsertHook<T>(this: RxCollection<T>, doc: T): void {
	const default_config = this.options.dynamicDefaults as DynamicDefaultsConfiguration<T>;

	for (const key of Object.keys(default_config) as (keyof T)[]) {
		const defaultValue = default_config[key];
		if (defaultValue === undefined) { // may be present but undefined
			continue;
		}
		if (doc[key] === undefined) { // catches both absent and undefined
			doc[key] = (typeof defaultValue === 'function' ? defaultValue(doc, this, key) : defaultValue);
		}
	}
}

const DynamicDefaultsPlugin: RxPlugin = {
	name: 'rxdb-dynamic-defaults',
	rxdb: true,

	hooks: {
		createRxCollection: {
			after: (o: { collection: RxCollection, creator: RxCollectionCreator }) => {
				if (typeof o.collection.options?.dynamicDefaults === 'object') {
					o.collection.preInsert(preInsertHook, false);
				}
			}
		}
	}
}
export default DynamicDefaultsPlugin
