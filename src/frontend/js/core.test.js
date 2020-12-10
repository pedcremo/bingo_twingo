import { showModal, clearModal } from './core.js';


describe('Test the render of the templates', () => {

    beforeAll(() => {
        showModal(`<div class="jest" id="jest">Test</div>`, null)
    });

    test('Test if showModal draws the modal', () => {
        expect(document.getElementById('jest')).toBeTruthy()
    })

    test('Test if clearModal deletes the modal', () => {
        clearModal('jest');
        expect(document.getElementById('jest')).not.toBeTruthy()
    })

})