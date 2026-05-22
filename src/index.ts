/*
 * Copyright (c) 2026 KampfCaspar <code@kampfcaspar.ch>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { RxCollection, RxCollectionCreator, RxPlugin } from "rxdb";

export type DefaultsDocCallback<T> = (doc: T, collection: RxCollection<T>) => void;
export type DefaultsFieldCallback<T, K extends keyof T> = (doc: T, collection: RxCollection<T>, key: K) => T[K];

export type DynamicDefaultsConfiguration<T> = {
	[K in keyof T] ?: T[K] | DefaultsFieldCallback<T, K>;
} | DefaultsDocCallback<T>;

function preInsertHook<T>(this: RxCollection<T>, doc: T): void {
	const default_config = this.options.dynamicDefaults as DynamicDefaultsConfiguration<T>;

	if (typeof default_config === 'function') {
		default_config(doc, this);
	}
	else if (typeof default_config === 'object') {
		for (const [key, value] of Object.entries(default_config) as [keyof T, T[keyof T] | DefaultsFieldCallback<T, keyof T>][]) {
			if (value === undefined) { // may be present but undefined
				continue;
			}
			if (doc[key] === undefined) { // catches both absent and undefined
				doc[key] = (typeof value === 'function')
					? (value as DefaultsFieldCallback<T, keyof T>)(doc, this, key)
					: value;
			}
		}
	}
}

export const DynamicDefaultsPlugin: RxPlugin = {
	name: 'rxdb-dynamic-defaults',
	rxdb: true,

	hooks: {
		createRxCollection: {
			after: (o: { collection: RxCollection, creator: RxCollectionCreator }) => {
				const type = typeof o.collection.options?.dynamicDefaults;
				if (
					(type === 'object' && o.collection.options.dynamicDefaults !== null)
					|| type === 'function'
				) {
					o.collection.preInsert(preInsertHook, false);
				}
			}
		}
	}
}
