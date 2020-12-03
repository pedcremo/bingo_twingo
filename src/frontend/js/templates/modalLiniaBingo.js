/**
 * Bingo and line template
 */

import linea1 from '../../assets/images/linia.gif'
import linea2 from '../../assets/images/linia2.gif'
import linea3 from '../../assets/images/linia3.gif'
import bingo1 from '../../assets/images/bingo.gif'
import bingo2 from '../../assets/images/bingo2.gif'
import bingo3 from '../../assets/images/bingo3.gif'

/**
 * Here we put the different line and bingo gifs in an arrangement
 */
const imgsBingo = [bingo1, bingo2, bingo3];

const imgsLinea = [linea1, linea2, linea3];

/**
 * These functions return a random gif from which we have imported
 */
function randomImg(imgs){
    return imgs[Math.round(Math.random() * ((imgs.length - 1) - 0) + 0)];
}// end_randomImg

export const modalLiniaBingo= (player,type) => {
    return `
    <div id="liniaForm" class="modal">
            <!-- Modal content -->
            <div class="modal-content">
                <span class="close">&times;</span>
                <h1>${type} player ${player}</h1>
                <img src=${(type === "bingo") ? randomImg(imgsBingo) : randomImg(imgsLinea)} />
            </div>  
        </div>
    `
} 