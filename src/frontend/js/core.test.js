import { docReady, showModal, clearModal, debug } from './core.js';

beforeAll(() => {
    showModal(`<div id="jest">Test</div>`, null)
});

test('Test if showModal draws the modals', () => {
    expect(document.getElementById('jest')).toBeTruthy()
})