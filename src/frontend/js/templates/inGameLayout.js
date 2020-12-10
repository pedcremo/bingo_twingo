import { debug, clearModal, showModal } from '../core';
import '../../css/ingame.css';
import { modalLiniaBingo } from './modalLiniaBingo.js';
import { modalMainMenu } from './modalMainMenu.js';
import { settings } from '../../../settings';

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
                            return "<th  id='" + val + "card' class='extracted blink'>" + val + "</th>";
                        } else {
                            return "<th  id='" + val + "card' class='extracted'>" + val + "</th>";
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

let renderManualCard = (extractedBalls = [], cardMatrix, player) => {

    let out = `
    <button id='linea/bingo' class="mainMenu__btn">Linea</button>
    <h1>Player ${player}</h1>
         <table class='bingoCard'>
            
             `+
        cardMatrix.map((value) =>
            "<tr>" + value.map((val) => {
                if (val == null) {
                    return "<th class='nulo'></th>"
                } else {
                    return "<th  id='" + val + "card' class='none'>" + val + "</th>"
                }
            }).join("")
            + "</tr>"
        ).join("") +
        `</table>`;
    document.getElementById(player).innerHTML = out;
}

export const inGameLayout = (socketIO, card, otherPlayers) => {

    const controllers = () => {

        let socket = socketIO;
        let line_status = false;
        let bingo_status = false;
        let extractedBalls = [];
        let lastBall;
        let secsModalLinea = settings.secsLineaWait;
        clearModal('bg');

        //Create a div to contain player online bingo card. Id == username
        let divRoot = document.createElement('div');
        divRoot.classList.add('bingoCardLayout');
        divRoot.setAttribute("id", card.username);
        let bingoCardsElement = document.getElementById('bingoCards');
        bingoCardsElement.innerHTML = ""; //Clear cards
        bingoCardsElement.appendChild(divRoot);
        //Render player card
        (settings.typeOnline == "manual") ?
            renderManualCard(extractedBalls, card.cardMatrix, card.username) :
            renderCard(extractedBalls, card.cardMatrix, card.username);


        //Render other players cards in order to have a visual reference
        otherPlayers.forEach((otherPlayer) => {
            let divRoot = document.createElement('div');
            divRoot.classList.add('bingoCardLayoutOther');
            divRoot.setAttribute("id", otherPlayer.username);
            document.getElementById('bingoCards').appendChild(divRoot);
            (settings.typeOnline == "manual") ?
                renderManualCard(extractedBalls, card.cardMatrix, card.username) :
                renderCard(extractedBalls, card.cardMatrix, card.username);
        });

        //Render bombo
        renderBalls();

        //Every time server picks upn a ball from bombo this event is broadcasted to all online players
        //joined on same game (room)
        socket.on('new_number', function (msg) {
            //Add new ball to array with already extracted balls     
            extractedBalls.push(msg.num)
            //Only 
            if (settings.typeOnline == "auto") {
                //Render player card to reflect any change maybe msg.num is in the card and we need to mark it
                renderCard(extractedBalls, card.cardMatrix, card.username);
            }

            //Render others players cards too 
            otherPlayers.forEach((otherPlayer) =>
                renderCard(extractedBalls, otherPlayer.card, otherPlayer.username)
            );
            //Check if player card is in 'linia' or bingo state
            if (settings.typeOnline == "auto") { checkBingo(card, extractedBalls, line_status); }


            if (lastBall) {
                document.getElementById(lastBall).className = 'bingoBall';
            }
            //a la bola actual le ponemos la animacion
            document.getElementById(msg.num).className = 'bingoBall blink'

            lastBall = msg.num;
        });

        //Check bingo or linia on a card
        let checkBingo = (card, extractedBalls, line_status) => {
            let bingo = true;
            card.cardMatrix.forEach((row) => {
                // let linia = row.filter((val) => { console.logconsole.log(document.getElementById(val+"card")); console.log("---------------------"); console.log((document.getElementById(val+"card")).className); if (!extractedBalls.includes(val) && val != null) return val }).length;
                let linia = row.filter((val) => { if (val != null) { if ((extractedBalls.includes(val)) && ((document.getElementById(val + "card").className).includes("extracted"))) return val } }).length;
                console.log(linia)
                if (linia != 5) bingo = false;
                else {
                    if (line_status == false) {
                        line_status = true;
                        //Inform server we have linia   
                        socket.emit('linia', { playId: card.gameID, card: card })
                        document.getElementById("linea/bingo").innerHTML="Bingo"
                    }
                }
            })

            if (bingo && bingo_status == false) {

                let send = {
                    game_id: card.gameID,
                    nickname: card.username,
                    card: card,
                }
                //Inform server we have bingo
                socket.emit('bingo', { playId: card.gameID, card: card })
            }
        }

        //Server broadcast all gamers game is over
        socket.on('end_game', function (msg) {
            console.log(msg);
        });
        //Server broadcast all gamers bingo claim has been accepted
        socket.on('bingo_accepted', function (msg) {
            let username = msg.card.username;
            showModal(modalLiniaBingo(username, "bingo"), function () {
                showModal(modalMainMenu());
            }, false)
            socket.disconnect();
            bingo_status = true;
        });
        //Server broadcast all gamers linia claim has been accepted
        socket.on('linia_accepted', function (msg) {
            let username = msg.card.username;
            showModal(modalLiniaBingo(username, "linea"), null, false)
            //In the time set for the variable (by default 3 seconds) the modal is destroyed.
            setTimeout(() => {
                clearModal('modal')
            }, secsModalLinea * 1000);
            line_status = true;
        });

        if (settings.typeOnline == "manual") {
            var elements = document.getElementsByClassName("none");
            for (var i = 0; i < elements.length; i++) {
                elements[i].addEventListener('click', function () {

                    this.className = this.className.includes("extracted") ? "none" : "none extracted"
                    // checkBingo(card, extractedBalls, line_status);

                })
            }


            let LineaBingo = document.getElementById('linea/bingo');
            LineaBingo.onclick = () => {
                checkBingo(card, extractedBalls, line_status)
            }
        }


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