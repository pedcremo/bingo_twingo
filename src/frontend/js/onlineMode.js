import { modalLobbyPlayers } from './templates/modalLobbyPlayers.js';
import { modalLiniaBingo } from './templates/modalLiniaBingo.js';
import io from 'socket.io-client'
import { clearModal, showModal } from './core.js';
import { inGameLayout } from './templates/inGameLayout';
import { settings } from '../../settings.js';
import { modalMainMenu } from './templates/modalMainMenu.js';

const onlineMode = (() => {

    // Connection  
    let siteIP = location.host;//returns the hostname and port of a URL. DOM api
    let socket = io();

    // Lobby
    let otherPlayers;
    let renderPlayersLobby
    let intervalTimer;
    let timerElement;

    // Game
    let card;
    let extractedBalls = [];
    let checkedBalls = [];
    let renderCard;
    let bingo_status = false;
    let line_status = false;
    let lastBall;
    let secsModalLinea = settings.secsLineaWait;



    /* LOBBY */

    let joinOnline = (onlineUsername) => {
        localStorage.setItem('onlineUsername', onlineUsername)
        socket = io('ws://' + siteIP, { transports: ['websocket'] });
        socket.on('connect', () => {
            socket.emit('join', onlineUsername);
            declareSocketEvents()
        });
    }

    let setModalLobby = (renderPlayersLobbyFunction, intervalTimerValue, timer) => {
        renderPlayersLobby = renderPlayersLobbyFunction
        intervalTimer = intervalTimerValue
        timerElement = timer
    }


    /* GAME EVENTS */

    let setGameLayout = (render) => {
        renderCard = render
    }

    //Check bingo or linia on a card
    let checkBingo = (card, extractedBalls, line_status) => {
        let bingo = true;
        card.cardMatrix.forEach((row) => {
            let linia = row.filter((val) => { if (!extractedBalls.includes(val) && val != null) return val }).length;
            if (linia > 0) bingo = false;
            else {
                if (line_status == false) {
                    line_status = true;
                    //Inform server we have linia   
                    onlineMode.emitLine(card)
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
            onlineMode.emitBingo(card)
        }
    }

    let emitLine = (card) => {
        socket.emit('linia', { playId: card.gameID, card: card })
    }

    let emitBingo = (card) => {
        socket.emit('bingo', { playId: card.gameID, card: card })
    }

    let checkBall = (ball) => {
        let number = parseInt(ball.innerHTML);
        if (!checkedBalls.includes(number)) {
            checkedBalls.push(parseInt(number))
            ball.classList.add('extracted')
        } else {
            checkedBalls.splice(checkedBalls.indexOf(number), 1)
            ball.classList.remove('extracted')
        }
    }

    let checkBingoCard = () => {
        checkBingo(card, extractedBalls, line_status);
    }


    /* SOCKET EVENTS */

    let declareSocketEvents = () => {

        /** Event triggered once a user joins an 
        * online game and get a ramdom card with unique id that 
        * should not be shared
        */
        socket.on('joined_game', function (msg) {
            let recivedCard = JSON.parse(msg)
            card = recivedCard
            //Online game            
            showModal(modalLobbyPlayers())
        });

        /* When a user is joined to the game socket.io even joined is triggered and we render the information in this modal */
        socket.on('joined', function (msg) {
            //The returned server message (msg) is information about players nicknames and their bingo cards
            let parsed = JSON.parse(msg);
            //We store other players cards and names to render in our browser
            otherPlayers = parsed.players.filter((item) => item.username != card.username)

            let messagesDiv = document.getElementById("listLobbyMessages");
            //Countdown to start the game
            timerElement.innerText = parsed.countDown;

            //We pass parsed msg to therender
            renderPlayersLobby(parsed)
            //Get last player joined 
            let userJoined = parsed.players[parsed.players.length - 1]
            let notif = userJoined.username + " has joined to the game"

            messagesDiv.innerHTML = messagesDiv.innerHTML + "<li>" + notif + "</li>";
        });

        //Event notifying game starts. It's triggered by server
        socket.on('starts_game', function (msg) {
            let div_bg = document.getElementById('div_bg');
            clearInterval(intervalTimer);
            //Modal where we render online game: bombo, player card and others players cards            
            showModal(inGameLayout(card, otherPlayers));
        });

        //Every time server picks upn a ball from bombo this event is broadcasted to all online players
        //joined on same game (room)
        socket.on('new_number', function (msg) {
            //Add new ball to array with already extracted balls     
            extractedBalls.push(msg.num)
            //Render player card to reflect any change maybe msg.num is in the card and we need to mark it
            renderCard(checkedBalls, card.cardMatrix, card.username);

            //Render others players cards too 
            otherPlayers.forEach((otherPlayer) =>
                renderCard(checkedBalls, otherPlayer.card, otherPlayer.username)
            );
            //Check if player card is in 'linia' or bingo state
            // checkBingo(card, checkedBalls, line_status);
            if (lastBall) {
                document.getElementById(lastBall).className = 'bingoBall';
            }
            //a la bola actual le ponemos la animacion
            document.getElementById(msg.num).className = 'bingoBall blink'

            lastBall = msg.num;
        });

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
    }

    return {
        joinOnline: joinOnline,
        setModalLobby: setModalLobby,
        checkBall: checkBall,
        emitLine: emitLine,
        emitBingo: emitBingo,
        checkBingoCard: checkBingoCard,
        setGameLayout: setGameLayout
    }


})()

export { onlineMode }
