import { debug, clearModal, showModal } from '../core';
import '../../css/ingame.css';
import { modalLiniaBingo } from './modalLiniaBingo.js';
import { modalMainMenu } from './modalMainMenu.js';
import { settings } from '../../../settings';
import { checkBingo } from '../../../common/checkBingo.js'

//Render bingo bombo
let renderBalls = () => {
    document.getElementById('balls').innerHTML = `${Array.from({length:90},(_,i) => i + 1).map(ball => `<div class='bingoBallEmpty' id='${ball}'>${ball}</div>`).join("")}`;
}

let renderCard = (extractedBalls=[], cardMatrix, player, pickedNums = undefined) => {       
    let out =`<h1>Player ${player}</h1>
        <div class="playerCard">
            <table class='bing0Card playerCard__table'> `+
                cardMatrix.map((value) => 
                "<tr>"+value.map((val) =>{
                    if (val==null){
                            return "<th class='nulo'></th>"
                    }else{
                        if (pickedNums == undefined){
                            if (extractedBalls && extractedBalls.indexOf(val) >= 0){
                                if (val===extractedBalls[extractedBalls.length-1]){
                                    return "<th class='cardNum extracted blink'>"+val+"</th>";                                  
                                }else{
                                    return "<th class='cardNum extracted'>"+val+"</th>";                                  
                                }
                            }else{
                                return "<th class='cardNum'>"+val+"</th>"
                            }
                        } else {                            
                            if (pickedNums.includes(val)){
                                return "<th class='cardNum extracted'>"+val+"</th>";  
                            }else{
                                return "<th class='cardNum'>"+val+"</th>"
                            }
                        }
                    }}).join("")
                +"</tr>"                          
                ).join("")+
            `</table>
        </div>
        ${
            (settings.onlineMode == 'manual') ? `<div class="cardOptions">
            <button id="claimLine" class"line-btn">Line!</button>
            <button id="claimBingo" class"bingo-btn">Bingo!</button>
        </div>`:''
        }
        `
    document.getElementById(player).innerHTML = out;
}

export const inGameLayout = (socketIO, card,otherPlayers) => {

    const controllers = () => {       
        let socket = socketIO;
        let line_status = false;
        let bingo_status = false;
        let extractedBalls = [];
        let lastBall;
        let secsModalLinea = settings.secsLineaWait;
        card.pickedNums = []

        // Mark number in the card and send it to the server.
        let markNumber = (el) => {
            let num = Number(el.innerHTML);
            if (!card.pickedNums.includes(num)){
                card.pickedNums.push(num);
                el.classList = 'extracted';
            } else {
                card.pickedNums = card.pickedNums.filter((el) => { return  el != num })
                el.classList = 'cardNum';
            }
            socket.emit('mark_number', { num: num, username: card.username });
        }
        
        //Create a div to contain player online bingo card. Id == username
        let divRoot = document.createElement('div');
        divRoot.classList.add('bingoCardLayout');
        divRoot.setAttribute("id",card.username);
        let bingoCardsElement = document.getElementById('bingoCards');
        bingoCardsElement.innerHTML = ""; //Clear cards
        bingoCardsElement.appendChild(divRoot);
        //Render player card
        renderCard(extractedBalls,card.cardMatrix,card.username);
        let cardNums = [...document.querySelectorAll('.cardNum')];
        cardNums.forEach( (el) => el.onclick = () => markNumber(el));
        
        //Render other players cards in order to have a visual reference
        otherPlayers.forEach((otherPlayer) => {
            let divRoot = document.createElement('div');
            divRoot.classList.add('bingoCardLayoutOther');
            divRoot.setAttribute("id",otherPlayer.username);
            document.getElementById('bingoCards').appendChild(divRoot);
            renderCard(extractedBalls,otherPlayer.card,otherPlayer.username)
        });

        //Render bombo
        renderBalls();

        //Every time server picks upn a ball from bombo this event is broadcasted to all online players joined on same game (room)
        socket.on('new_number', function (msg) {       
            extractedBalls.push(msg.num) //Add new ball to array with already extracted balls     
            //Render others players cards too (ONLY ON "AUTOMATIC MODE")
            if (settings.onlineMode == 'auto') {
                renderCard(extractedBalls,card.cardMatrix,card.username);
                otherPlayers.forEach((otherPlayer) => renderCard(extractedBalls,otherPlayer.card,otherPlayer.username) );
                let check = checkBingo(card,extractedBalls,line_status);
                if ( check.linea ) socket.emit('linia', { playId: card.gameID, card: card })
                if ( check.bingo ) socket.emit('bingo', { playId: card.gameID, card: card })
            }
            if ( lastBall ) { document.getElementById(lastBall).className = 'bingoBall' }
            // We put the animation on the current ball
            document.getElementById(msg.num).className = 'bingoBall blink'
            lastBall = msg.num;
        });
        if (settings.onlineMode == 'manual'){
            document.getElementById('claimLine').onclick = () => { if (!line_status) socket.emit('linia', { playId: card.gameID, card: card })};
            document.getElementById('claimBingo').onclick = () => { if (!bingo_status) socket.emit('bingo', { playId: card.gameID, card: card }) };

            // render other players cards when someone marks a number
            socket.on('marked_number', (msg) => {
                otherPlayers.map((player) => {
                    if (msg.username == player.username){
                        if (player.pickedNums.includes(msg.num)) {
                            player.pickedNums = player.pickedNums.filter((num) => num != msg.num)
                        }else{
                            player.pickedNums.push(msg.num);
                        }
                        renderCard(extractedBalls, player.card, player.username, player.pickedNums)
                    } 
                }); 
            });
        }
        
        
        //Server broadcast all gamers game is over
        socket.on('end_game', (msg) => console.log(msg));

        //Server broadcast all gamers bingo claim has been accepted
        socket.on('bingo_accepted', function (msg) {
            bingo_status = true;
            showModal(modalLiniaBingo(msg.card.username, "bingo"), () => location.href = '/#/', false)
            socket.disconnect();  
        });

        //Server broadcast all gamers linia claim has been accepted
        socket.on('linia_accepted', function (msg) {     
            line_status = true;       
            showModal(modalLiniaBingo(msg.card.username, "linea"),null,false)
            //In the time set for the variable the modal is destroyed.
            setTimeout(() => clearModal('modal'), secsModalLinea * 1000);  
        });
    }

    return {
        template:
            `<div class="gameLayout">
                <div id="bingoCards" class="cards"></div>
                <div class="panel">
                    <div id="balls" class="balls__grid"></div>
                </div>
            </div>`,
        controllers: controllers
    }
}