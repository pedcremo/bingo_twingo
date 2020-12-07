import { debug, clearModal, showModal } from '../core';
import '../../css/ingame.css';
import { modalLiniaBingo } from './modalLiniaBingo.js';
import { modalMainMenu } from './modalMainMenu.js';

let settings = require('../../../settings')

//Render bingo bombo
let renderBalls = () => {
    document.getElementById('balls').innerHTML = `${Array.from({length:90},(_,i) => i + 1).map(ball => `<div class='bingoBallEmpty' id='${ball}'>${ball}</div>`).join("")}`;
}

//Render card 
let renderCard = (extractedBalls=[],cardMatrix,player) => {
        
    let out =`<h1>Player ${player}</h1>
         <table class='bingoCard'>
            
             `+
              cardMatrix.map((value) => 
              "<tr>"+value.map((val) =>{
                   if (val==null){
                        return "<th class='nulo'></th>"
                   }else{
                        if (extractedBalls && extractedBalls.indexOf(val) >= 0){
                            if (val===extractedBalls[extractedBalls.length-1]){
                                return "<th class='extracted blink'>"+val+"</th>";                                  
                            }else{
                                return "<th class='extracted'>"+val+"</th>";                                  
                            }
                        }else{
                             return "<th>"+val+"</th>"
                        }
                   }}).join("")
              +"</tr>"                          
              ).join("")+
         `</table>`;
    document.getElementById(player).innerHTML = out;
}

//Render card manual using new matrix
let renderCardManual = (extractedBalls=[],cardMatrix,player) => {
        
    let out =`<h1>Player ${player}</h1>
         <table class='bingoCard'>
            
             `+
              cardMatrix.map((value) => 
              "<tr>"+value.map((val) =>{
                   if (val['number']==null){
                        return "<th class='nulo'></th>"
                   }else{
                        return "<th id='"+player+"_cardNum_"+val['number']+"' class='number'>"+val['number']+"</th>"
                   }}).join("")
              +"</tr>"                          
              ).join("")+
         `</table>`;
         console.log(player);
    document.getElementById(player).innerHTML = out;
}

let updateMatrix = (cardMatrix) =>{
    console.log(cardMatrix);
    for (let i = 0; i < cardMatrix.length; i++) {
        for (let r = 0; r < cardMatrix[i].length; r++) {
            if(cardMatrix[i][r]==null){
                cardMatrix[i][r] = {
                    'number':cardMatrix[i][r],
                    active: true
                }   
            }else{
                cardMatrix[i][r] = {
                    'number':cardMatrix[i][r],
                    active: false
                }   
            }

        }
    }
}




export const inGameLayout = (socketIO, card,otherPlayers) => {

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
        divRoot.setAttribute("id",card.username);
        document.getElementById('bingoCards').appendChild(divRoot);

        //function to laod clicks of the card
        let loadmanualClicks = () =>{
            let numbers = document.getElementsByClassName("number");
            for (let i = 0; i < numbers.length; i++) {
                numbers[i].addEventListener('click', function(){
                    //get number from id with split
                    let number = this['id'].split('_',4)[2]
                    console.log(number);
                    //change class
                    this.className = this.className.includes("extracted") ? "number" : "number extracted";
                    //change active on cardmatrix to true or false. (to check later)
                    card.cardMatrix.forEach((row)=>{
                        for (let i = 0; i < row.length; i++) {
                            //search number clicked
                            if(row[i]['number']==number){
                                row[i]['active']= this.className.includes("extracted") ? true : false;
                            }
                        }
                        
                    })
                    sendManualBingo(card,line_status)
                })
            }
        }

        //Render other players cards in order to have a visual reference
        let loadOtherplayercards = (otherPlayers) =>{
            otherPlayers.forEach((otherPlayer) => {
                let divRoot = document.createElement('div');
                divRoot.classList.add('bingoCardLayoutOther');
                divRoot.setAttribute("id",otherPlayer.username);
                document.getElementById('bingoCards').appendChild(divRoot);
                if(settings.manualGame==true){
                    updateMatrix(otherPlayer.card)
                    renderCardManual(extractedBalls,otherPlayer.card,otherPlayer.username);
                }else{
                    renderCard(extractedBalls,otherPlayer.card,otherPlayer.username);
                }
            });
        }
        //Render bombo
        renderBalls();
        //Every time server picks upn a ball from bombo this event is broadcasted to all online players
        //joined on same game (room)
        socket.on('new_number', function (msg) {  
            //Add new ball to array with already extracted balls     
            extractedBalls.push(msg.num)
            //check gamemode
            if(!settings.manualGame){
                //Render player card to reflect any change maybe msg.num is in the card and we need to mark it
                renderCard(extractedBalls,card.cardMatrix,card.username);
                //Render others players cards too
                otherPlayers.forEach((otherPlayer) =>{
                    renderCard(extractedBalls,otherPlayer.card,otherPlayer.username);
                });
                //Check if player card is in 'linia' or bingo state
                checkBingo(card,extractedBalls,line_status);
            }
            if(lastBall){
                document.getElementById(lastBall).className = 'bingoBall';
            }
            //a la bola actual le ponemos la animacion
            document.getElementById(msg.num).className = 'bingoBall blink'
            lastBall = msg.num;
        });
        
        //Check bingo or linia on a card
        let checkBingo = (card, extractedBalls,line_status) => {
            console.log("CHECKBINGO");
            console.log(line_status);
            console.log(extractedBalls.length);
            let bingo = true;
            card.cardMatrix.forEach((row) => {
                let linia = row.filter((val) => { if (!extractedBalls.includes(val) && val != null) return val }).length;
                if (linia > 0) bingo = false;
                else {
                  if (line_status == false) {
                     line_status = true;
                     //Inform server we have linia   
                     socket.emit('linia', { playId: card.gameID, card: card })
                  }
               }
            })
        
            if (bingo && bingo_status == false) {
               //Inform server we have bingo
               socket.emit('bingo', { playId: card.gameID, card: card })
            }
         }

         //function to checkmanual Bingo or linea
         let sendManualBingo = (card,line_status) =>{
            let contlinia = 0;
            //by clicking on each line we check if all the numbers in a line have the active attribute. If so, send it to the server to check it
            //If all the numbers are marked in the three lines, send bingo to check the server
            card.cardMatrix.forEach((row)=>{
                let linia = true;
                row.forEach((n)=>{
                    if(n['active']==false){
                        linia = false;
                    }
                })
                if(linia){
                    if(!line_status){
                        console.log("ENVIADA LINEA AL SERVIDOR");
                        socket.emit('linia', { 'playId': card.gameID, 'card': card, 'extractedBalls': extractedBalls })
                    }
                    contlinia++;
                    if(contlinia>=3){
                        console.log("ENVIADO BINGO AL SERVIDOR");
                    }
                }
            })
         }

        //check if gamemode is manual or no
        //LOADER
        if(settings.manualGame==true){
            updateMatrix(card.cardMatrix);
            renderCardManual(extractedBalls,card.cardMatrix,card.username);
            //load the clicks of all the numbers (only local player)
            loadmanualClicks();
            loadOtherplayercards(otherPlayers);
        }else{
            renderCard(extractedBalls,card.cardMatrix,card.username);
            loadOtherplayercards(otherPlayers);
        }
        
        //Server broadcast all gamers game is over
        socket.on('end_game', function (msg) {
            console.log(msg);
        });
        //Server broadcast all gamers bingo claim has been accepted
        socket.on('bingo_accepted', function (msg) {
            let username = msg.card.username;
            showModal(modalLiniaBingo(username, "bingo"),function() {
                showModal(modalMainMenu());
            },false)
            socket.disconnect();
            bingo_status = true;
        });
        //Server broadcast all gamers linia claim has been accepted
        socket.on('linia_accepted', function (msg) {            
            let username = msg.card.username;
            showModal(modalLiniaBingo(username, "linea"),null,false)
            //In the time set for the variable (by default 3 seconds) the modal is destroyed.
            setTimeout(() => {
                clearModal('modal')
            }, secsModalLinea * 1000);
            line_status = true;
        });
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