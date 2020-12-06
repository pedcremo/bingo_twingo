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
            <table class='bingoCard' id='bingoCardNumbers'>
                
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


export const inGameLayout = (socketIO, card,otherPlayers,auto=true) => {  //Auto will be false when starts a manual game

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
        //Render player card
        renderCard(extractedBalls,card.cardMatrix,card.username);
        
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

        //Every time server picks upn a ball from bombo this event is broadcasted to all online players
        //joined on same game (room)
        socket.on('new_number', function (msg) {       
            //Add new ball to array with already extracted balls     
            extractedBalls.push(msg.num)
            //Render player card to reflect any change maybe msg.num is in the card and we need to mark it
            //Aqui se llama cada vez
            auto?renderCard(extractedBalls,card.cardMatrix,card.username):null;
            
            
            //Render others players cards too 
            otherPlayers.forEach((otherPlayer) =>
                renderCard(extractedBalls,otherPlayer.card,otherPlayer.username)
            );
            //Check if player card is in 'linia' or bingo state
            auto?checkBingo(card,extractedBalls,line_status):null;   //Only check bingo or linea everytime on auto mode
            if(lastBall){
                document.getElementById(lastBall).className = 'bingoBall';
            }
            //a la bola actual le ponemos la animacion
            document.getElementById(msg.num).className = 'bingoBall blink'

            lastBall = msg.num;
        });
        
        //Check bingo or linia on a card
        let checkBingo = (card, extractedBalls,line_status) => {
            console.log(extractedBalls.length);
            let bingo = true;
            card.cardMatrix.forEach((row) => {
                let linia = row.filter((val) => { if (!extractedBalls.includes(val) && val != null) return val }).length;
                if (linia > 0) bingo = false;
                else if(line_status == false){
                     line_status = true;
                     //Inform server we have linia   
                     socket.emit('linia', { playId: card.gameID, card: card })
               }else if(!auto){
                   console.log("NO HAY LINEA");
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
            }else if(!auto){//We check bingo here when manual mode is activated, and in manual mode we only check bingo when client click check bingo button
                console.log("NO HAY BINGO");
            }
         }
        
        //Server broadcast all gamers game is over
        socket.on('end_game', function (msg) {
            console.log(msg);
        });
        //Server broadcast all gamers bingo claim has been accepted
        socket.on('bingo_accepted', function (msg) {
            showModal(modalLiniaBingo(msg.card.username, "bingo"),function() {
                showModal(modalMainMenu());
            },false)
            socket.disconnect();
            bingo_status = true;
        });
        //Server broadcast all gamers linia claim has been accepted
        socket.on('linia_accepted', function (msg) {            
            showModal(modalLiniaBingo(msg.card.username, "linea"),null,false)
            //In the time set for the variable (by default 3 seconds) the modal is destroyed.
            setTimeout(() => {
                clearModal('modal')
            }, secsModalLinea * 1000);
            line_status = true;
        });


        //CHECK MANUAL
        if(!auto){
            document.getElementById('check_bingo_linea').onclick= ()=>{
                checkBingo(card,extractedBalls,line_status);  
            }
            //Detect click on carPlayer here
            let cardNumbers=document.getElementById('bingoCardNumbers');
            cardNumbers.onclick=(element)=>{
              
                //number is the number clicked
                let number=element.target;
                if(number.innerHTML>0){
                    if(number.classList.contains('extracted')){
                        number.classList.remove('extracted')
                    }else{
                        number.classList.add('extracted');
                    }
                }
            }

        }

        ////
    }

  if(auto){
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
  }else{
    return {
        
        template:
            `
            <div class="gameLayout">
                <div id="bingoCards" class="cards">
                <div class="button mainMenu__btn" id="check_bingo_linea">Check Linea or Bingo</div>
                </div>
                <div class="panel">
                    <div id="balls" class="balls__grid"></div>
                </div>
            </div>
            `,
        controllers: controllers
    }
  }

    
}