/*
 * Copyright (c) 2026 KampfCaspar <code@kampfcaspar.ch>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, it } from 'mocha';
import assert from "assert";

import {
	addRxPlugin,
	createRxDatabase,
	ExtractDocumentTypeFromTypedRxJsonSchema,
	RxCollection,
	toTypedRxJsonSchema
} from "rxdb";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { RxDBDevModePlugin, disableWarnings } from "rxdb/plugins/dev-mode";

import { DynamicDefaultsPlugin } from "../src";

const collectionSchema = toTypedRxJsonSchema({
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: {
			type: 'string',
			maxLength: 100
		},
		name: {
			type: 'string'
		},
		other_name: {
			type: 'string'
		},
		age: {
			type: 'number'
		},
		doubleAge: {
			type: 'number',
			default: 20
		},
		tripleAge: {
			type: 'number'
		}
	},
	required: ['id']
} as const);

type DocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof collectionSchema>;
type CollectionType = RxCollection<DocType, unknown, { super_static: () => string }>;

describe("DynamicDefaultsPlugin", async () => {

	// await removeRxDatabase('test_db', getRxStorageMemory());
	const db = await createRxDatabase({
		name: 'test_db',
		storage:
			wrappedValidateAjvStorage({
				storage: getRxStorageMemory()
			})
	});

	describe("adding the plugin", async () => {
		it("should not throw an error", async () => {
			disableWarnings();
			addRxPlugin(RxDBDevModePlugin);
			addRxPlugin(DynamicDefaultsPlugin);
		})
	});

	describe("adding collection with static defaults", async () => {
		it("should not throw an error", async () => {
			await db.addCollections({
				first: {
					schema: collectionSchema,
					options: {
						dynamicDefaults: {
							name: 'default name',
							age: 10,
							doubleAge: 12
						}
					}
				}
			});
		});
		it("should apply defaults when inserting document", async () => {
			const doc = await db.first.insert({
				id: 'test_id_1'
			});
			assert.equal(doc.name, 'default name');
			assert.equal(doc.age, 10);
		});
		it("should NOT apply defaults if property defined", async () => {
			const doc = await db.first.insert({
				id: 'test_id_2',
				name: 'custom name'
			});
			assert.equal(doc.name, 'custom name');
			assert.equal(doc.age, 10);
		});
		it("should apply AFTER schema defaults", async () => {
			const doc = await db.first.insert({
				id: 'test_id_3',
			});
			assert.equal(doc.doubleAge, 20);
		});
	});

	describe("adding collection with dynamic defaults", async () => {
		it("should not throw an error", async () => {
			await db.addCollections({
				second: {
					schema: collectionSchema,
					statics:{
						super_static: () => "static name"
					},
					options: {
						dynamicDefaults: {
							id: () => 'test_id_99',
							name: () => 'default name',
							other_name: (doc: DocType, collection: CollectionType) => collection.super_static(),
							age: (doc: DocType) => doc.id.length,
							tripleAge: (doc: DocType, collection: CollectionType, key: string) => key.length
						}
					}
				}
			});
		});
		it("should apply defaults without parameters", async () => {
			const doc = await db.second.insert({
				id: 'test_id_1'
			});
			assert.equal(doc.name, 'default name');
		});
		it("should apply defaults with doc parameter", async () => {
			const doc = await db.second.insert({
				id: 'test_id_2'
			});
			assert.equal(doc.age, 9);
		});
		it("should apply defaults with doc and key parameter", async () => {
			const doc = await db.second.insert({
				id: 'test_id_3'
			});
			assert.equal(doc.tripleAge, 9);
		});
		it("should apply defaults with collection parameter", async () => {
			const doc = await db.second.insert({
				id: 'test_id_4'
			});
			assert.equal(doc.other_name, "static name");
		});
		it("should be able to populate primary key", async () => {
			const doc = await db.second.insert({
			});
			assert.equal(doc.id, "test_id_99");
		});
	});

	describe("adding collection with doc level default", async () => {
		it("should not throw an error", async () => {
			await db.addCollections({
				third: {
					schema: collectionSchema,
					statics:{
						super_static: () => "static name"
					},
					options: {
						dynamicDefaults: (doc : DocType, collection : CollectionType) => {
							doc.id ??= 'test_id_99';
							doc.name ??= 'default name';
							doc.other_name ??= collection.super_static();
							doc.age ??= doc.id.length;
						}
					}
				}
			});
		});
		it("should apply doc defaults", async () => {
			const doc = await db.third.insert({
				id: 'test_id_1'
			});
			assert.equal(doc.id, 'test_id_1');
			assert.equal(doc.name, 'default name');
			assert.equal(doc.age, 9);
			assert.equal(doc.other_name, "static name");
		});
		it("should be able to populate primary key", async () => {
			const doc = await db.third.insert({
			});
			assert.equal(doc.id, "test_id_99");
		});
	});

});
