import test, { describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { PlaceService } from '../src/core/place-service.js';
describe('PlaceService Integration (Node Native Test)', () => {
    let service;
    before(() => {
        service = new PlaceService();
    });
    test('listAllCollections should return collections with valid structure', async () => {
        const result = await service.listAllCollections();
        if (result.isError) {
            const errorText = result.content[0].text;
            const skipKeywords = [
                "BROWSER_CONNECTION_FAILED",
                "AUTH_REQUIRED",
                "BROWSER_NO_ACTIVE_TABS",
                "SIDEBAR_NOT_FOUND"
            ];
            if (skipKeywords.some(kw => errorText.includes(kw))) {
                console.warn(`[Skipped] Pre-condition not met: ${errorText}`);
                return;
            }
            throw new Error(`Integration failed: ${errorText}`);
        }
        const collections = JSON.parse(result.content[0].text);
        assert.ok(Array.isArray(collections), 'Result should be an array');
        assert.ok(collections.length > 0, 'Should find at least one collection');
        const first = collections[0];
        assert.ok(first.name, 'Collection should have a name');
        assert.ok(first.type, 'Collection should have a type');
        assert.ok(typeof first.count === 'number', 'Collection should have a count number');
        console.log(`[Success] Found ${collections.length} collections via Native Test.`);
    });
});
