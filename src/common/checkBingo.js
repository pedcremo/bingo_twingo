import { settings } from '../settings.js'

/**
 * Function to check if the card has line or bingo. If the card have nothing, it returns false, but if have bingo or line
 * it returns {linea:true} or {bingo:true}. This function can be used in both modes (auto or manual).
 * 
 * @param {Array} card 
 * @param {Array} extractedBalls 
 * @param {Boolean} line_status 
 */
export let checkBingo = (card, extractedBalls, line_status = false) => {
    let linea = false;
    let bingo = true;
    card.cardMatrix.forEach((row) => {
        let linia = row.filter((val) => { if (!extractedBalls.includes(val) && val != null) return val }).length;
        if ( settings.onlineMode == 'manual' ){
            let lineaPicked = row.filter((num) => { if (!card.pickedNums.includes(num) && num != null) return num }).length;
            if (linia > 0 || lineaPicked > 0) bingo = false;
            else if (line_status == false && lineaPicked == 0) linea = true;
        } else {
            if (linia > 0 ) bingo = false;
            else if (line_status == false ) linea = true;
        }
    });
    if (linea) return { linea: true }
    if (bingo) return { bingo: true }
    return false
}