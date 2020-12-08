import { clearModal } from '../core';
import '../../css/ingame.css';
import { onlineMode } from '../onlineMode';

//Render bingo bombo
let renderBalls = () => {
    document.getElementById('balls').innerHTML = `${Array.from({ length: 90 }, (_, i) => i + 1).map(ball => `<div class='bingoBallEmpty' id='${ball}'>${ball}</div>`).join("")}`;
}

//Render card 
let renderCard = (extractedBalls = [], cardMatrix, player) => {

    let out = `<h1>Player ${player}</h1>
         <table class='bingoCard'>
            
             `+
        cardMatrix.map((value) =>
            "<tr>" + value.map((val) => {
                if (val == null) {
                    return "<th class='nulo'></th>"
                } else {
                    if (extractedBalls && extractedBalls.indexOf(val) >= 0) {
                        if (val === extractedBalls[extractedBalls.length - 1]) {
                            return "<th class='extracted blink'>" + val + "</th>";
                        } else {
                            return "<th class='extracted'>" + val + "</th>";
                        }
                    } else {
                        return "<th>" + val + "</th>"
                    }
                }
            }).join("")
            + "</tr>"
        ).join("") +
        `</table>`;
    document.getElementById(player).innerHTML = out;
}

export const inGameLayout = (card, otherPlayers) => {

    const controllers = () => {

        onlineMode.setGameLayout(renderCard)

        let extractedBalls = [];
        clearModal('bg');

        //Create a div to contain player online bingo card. Id == username
        let divRoot = document.createElement('div');
        divRoot.classList.add('bingoCardLayout');
        divRoot.setAttribute("id", card.username);
        let bingoCardsElement = document.getElementById('bingoCards');
        bingoCardsElement.innerHTML = ""; //Clear cards
        bingoCardsElement.appendChild(divRoot);
        //Render player card
        renderCard(extractedBalls, card.cardMatrix, card.username);

        //Render other players cards in order to have a visual reference
        otherPlayers.forEach((otherPlayer) => {
            let divRoot = document.createElement('div');
            divRoot.classList.add('bingoCardLayoutOther');
            divRoot.setAttribute("id", otherPlayer.username);
            document.getElementById('bingoCards').appendChild(divRoot);
            renderCard(extractedBalls, otherPlayer.card, otherPlayer.username)
        });

        //Render bombo
        renderBalls();
    }

    return {
        template:
            `
            <div class="gameLayout">
                <div id="bingoCards" class="cards">
                
                </div>
                <div class="panel">
                    <div id="balls" class="balls__grid"></div>
                </div>
            </div>
            `,
        controllers: controllers
    }
}