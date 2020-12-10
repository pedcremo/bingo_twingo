
import { Bombo } from './bombo.js';
import { checkBingo } from './checkBingo.js';
import { BingoCard } from './bingoCard.js'

let bombo;
let card;
describe('Generate bingo bombo and card', () => {
    beforeAll(() => {
        document.body.innerHTML = `<div>
                                    <div id="balls"></div>
                                    </div>
                                    <div id="card"></div>`;
        bombo = new Bombo(document.getElementById('balls'));
        card = new BingoCard("Player", document.getElementById('card'));
    });
})

test('Checked Lines', () => expect(checkLines()).toBeTruthy());
test('Checked Lines', () => expect(checkBingos()).toBeTruthy());


let generateNewBombo = (loops = 60) => {
    bombo = new Bombo(document.getElementById('balls'));
    for (let i = 0; i < loops; i++) {
        bombo.pickNumber();
    }
}
let generateNewCard = () => card = new BingoCard("Player", document.getElementById('card'));


let checker = (card, extractedBalls, line_status = false) => {
    let linea = false;
    let bingo = true;
    card.cardMatrix.forEach((row) => {
        let linia = row.filter((val) => { if (!extractedBalls.includes(val) && val != null) return val }).length;
        if (linia > 0) bingo = false;
        else if (line_status == false) linea = true;
    });
    if (linea) return { linea: true }
    if (bingo) return { bingo: true }
    return false
}

let checkLines = () => {
    let status = true;
    for (let x = 0; x < 150; x++) {
        generateNewBombo();
        generateNewCard();
        let cardTest = {
            cardMatrix: card.getMatrix()
        }
        let check = checkBingo(cardTest, bombo.getExtractedNumbers());
        let check2 = checker(cardTest, bombo.getExtractedNumbers());
        if (typeof check === 'object') {
            if (check.linea != check2.linea) status = false
        } else {
            if (check != check2) status = false
        }

    }
    return status;
}

let checkBingos = () => {
    let status = true;
    for (let x = 0; x < 150; x++) {
        generateNewBombo(80);
        generateNewCard();
        let cardTest = {
            cardMatrix: card.getMatrix()
        }
        let check = checkBingo(cardTest, bombo.getExtractedNumbers(), true);
        let check2 = checker(cardTest, bombo.getExtractedNumbers(), true);
        if (typeof check === 'object') {
            if (check.bingo != check2.bingo) status = false
        } else {
            if (check != check2) status = false
        }

    }
    return status;
}