import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSvg } from '../check.mjs';

const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>';
const swap = (s) => ok.replace('<path d="M0 0h1v1z"/>', s);

test('a clean svg has no problems', () => assert.deepEqual(checkSvg(ok), []));
test('flags <text> elements (must be outlined)', () => assert.ok(checkSvg(swap('<text>x</text>')).some((p) => /text/i.test(p))));
test('flags <script> elements', () => assert.ok(checkSvg(swap('<script>1</script>')).some((p) => /script/i.test(p))));
test('flags external references', () => assert.ok(checkSvg(swap('<image href="https://e.com/x.png"/>')).some((p) => /external/i.test(p))));
test('flags foreignObject', () => assert.ok(checkSvg(swap('<foreignObject/>')).some((p) => /foreignObject/i.test(p))));
test('flags malformed xml', () => assert.ok(checkSvg(swap('<g><path/>')).some((p) => /xml/i.test(p))));
test('flags oversize files', () => assert.ok(checkSvg(ok, { maxBytes: 10 }).some((p) => /size/i.test(p))));
