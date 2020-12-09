
import './css/style.css';
import './css/ingame.css';
import { docReady, showModal, clearModal, debug } from './js/core.js';
//import './js/card.js';
import { Bombo } from '../common/bombo.js';
import { BingoCard } from '../common/bingoCard.js';
import { PubSub } from '../common/pubSub.js';
import { modalPlayers, setupAudioBingoWin } from './js/templates/modalPlayers.js';
import { modalLiniaBingo } from './js/templates/modalLiniaBingo.js';
import { modalMainMenu } from './js/templates/modalMainMenu.js';
import io from 'socket.io-client';
// import  * as settings  from '../utils/settings';
let settings = require('../settings')

/**
 * Within the app constant(closure), we have defined several variables with anonymous functions which are responsible for starting and stopping the game
 * As for the start variable, it is where we have the subscription patterns, 
 * and it goes down for the line and the bingo, so that when one player gets a 'line', the others can no longer and in the case of bingo,
 * when one player sings bingo the game stops and in addition to showing a modal with a gif, an audio jumps with a voice that sings BIINGO.
 */

const app = (() => {
    console.log(settings.ballspeed);
    let myApp;
    const speed = settings.ballspeed; //in miliseconds
    let bombo;
    let players = []
    let currentPlayer = {};
    let ballsExtracted;
    let pubSub = new PubSub();
    let stateApp = "stop";
    let siteIP = location.host;//returns the hostname and port of a URL. DOM api
    const socket = io('ws://'+siteIP, {transports: ['websocket']});

    /* Every time runs pick a ball from bombo bingo game */
    let getBallFromBombo = () => {
        /* Get a ball from bombo */
        let num = bombo.pickNumber();

        /* If num is a real number we inform all subscribers we have just picked a ball */
        if (num) {
            pubSub.publish("New Number", bombo.getExtractedNumbers());

            /* otherwise means bombo is running out of balls and we should finish the game */
        } else {
            stop();
        }
    };

    /* Stop bingo play an clear timer */
    let stop = () => {
        stateApp = "stop";
        clearInterval(myApp);
    }
    let resume = () => {
        stateApp = "run";
        myApp = setInterval(getBallFromBombo, app.speed);
    }
    /* Start bingo play */
    let offline = () => {
        clearModal('bg');

        prepareGame(false);

        players = [];
        /* Get players names from browser localStorage */
        let playersNames = JSON.parse(localStorage.getItem('playersNames'));
        /* Clear html layer reserved for render bingo cards */
        document.getElementById('bingoCards').innerHTML = ""
        /* Create one bingo card for every bingo player */
        playersNames.forEach(name => {
            players.push(new BingoCard({name: name}, document.getElementById('bingoCards'), false, false, undefined, pubSub));
        });
        /* Start throwing first ball from bombo. Here we go */
        getBallFromBombo();
        /* Timer in charge to pace time between balls extraction from bombo */
        myApp = setInterval(getBallFromBombo, app.speed);
    }

    let online = () => {
        clearModal('bg');
        let mainMenu = document.getElementById('mainMenu');
        mainMenu && mainMenu.remove();


        prepareGame(true);

        ballsExtracted = [];
        currentPlayer.name = window.localStorage.getItem('onlineUsername'),

        socket.emit('join', currentPlayer.name);

        socket.on('joined_game', data => {
            data = JSON.parse(data);
            console.log(data);
            setAccounter(data.game.countDown);
            currentPlayer.card = new BingoCard(
                currentPlayer,
                document.getElementById('myCard'),
                true,
                false,
                data.card.cardMatrix,
                pubSub
            );

            pubSub.publish('New Number', [-1]);
        });

        socket.on('joined', data => {
            data = JSON.parse(data);
            renderPlayers(data.players);
        });

        socket.on('starts_game', data => {
            console.log(data);
            players = [];
        });

        socket.on('new_number', data => {
            bombo.lightBall(data.num);
            ballsExtracted.push(data.num);
            pubSub.publish("New Number", ballsExtracted);
            console.log(data.num);
        });

        socket.on('linia_accepted', data => {
            console.log(data);
            pubSub.publish("LINIA", data.name);
        });

        socket.on('bingo_accepted', data => {
            console.log(data);
            pubSub.publish("BINGO", data.name);
        });

        socket.on('end_game', data => {
            console.log(data);
        });

        let renderPlayers = (newPlayers) => {
            // I render all players because one player can left the game
            console.log('=>', newPlayers);
            document.getElementById('rivalCards').innerHTML = "";
            newPlayers.map(newPlayer => {
                if (currentPlayer.name != newPlayer.username) {
                    newPlayer.card = new BingoCard(
                        newPlayer.username,
                        document.getElementById('rivalCards'),
                        true,
                        true,
                        newPlayer.card,
                        pubSub
                    ).getMatrix();
                    console.log(newPlayer);
                    players.push(newPlayer);
                    pubSub.publish('New Number', [-1]);
                }
            });
        }

        let setAccounter = (remainingTime) => {
            console.log(remainingTime);
            setTimeout(() => {
                remainingTime > 0 ? setAccounter(remainingTime - 1) : false;
            }, 1000);
        }
    }

    let prepareGame = (isOnline) => {
        /* Basic template where we are going to render bingo play */
        let doc = isOnline ?
            new DOMParser().parseFromString(`
            <div>
                <div class="gameLayout">
                    <div id="bingoCards" class="cards">
                        <div id="myCard"></div>
                        <div id="rivalCards"></div>
                    </div>
                    <div class="panel">
                        <div id="balls" class="balls__grid"></div>
                    </div>
                    <div style="width: 100%; position: fixed; bottom:0; left:0; display:flex; align-items:center; justify-content:center">
                        <button id="lineaBtn" style="font-size: 2em">LINEA</button>
                        <button id="bingoBtn" style="font-size: 2em">BINGO</button>
                    </div>
            </div>
        `, 'text/html') : new DOMParser().parseFromString(`
            <div class="gameLayout">
                <div id="bingoCards" class="cards"></div>
                <div class="panel">
                    <div id="balls" class="balls__grid"></div>
                </div>
                <div>
                    <div class="blackPanel" id="blackPanel"></div>
                    <a class="pauseOfflineBtn" id="pauseOfflineBtn"><i class="fas fa-pause"></i></a>
                </div>
            </div>
        `, 'text/html');

        let layout = doc.body.firstChild;
        document.getElementById('main').appendChild(layout);

        /* Layer where initial background video has been loaded we
        need to remove it as we are going to start playing */
        let videoEl = document.getElementById('videoBackground');
        if (videoEl) videoEl.remove();

        if (!isOnline) {
            let pauseBtn = document.getElementById('pauseOfflineBtn');
            let blackPanel = document.getElementById('blackPanel')
            pauseBtn.onclick = function () {
                if (stateApp == "stop") {
                    blackPanel.style.display = "none"
                    pauseBtn.innerHTML = '<i class="fas fa-pause"></i>'
                    resume();
                } else {
                    blackPanel.style.display = "unset"
                    pauseBtn.innerHTML = '<i class="fas fa-play"></i>'
                    stop();
                }
            }
        } else if (!settings.automatic) {
            let lineaBtn = document.getElementById('lineaBtn');
            let bingoBtn = document.getElementById('bingoBtn');

            lineaBtn.addEventListener('click', () => {
                console.log(extractResultCheck());
                if (extractResultCheck() == 'LINEA') socket.emit('linia', currentPlayer);
            });
            bingoBtn.addEventListener('click', () => {
                console.log(extractResultCheck());
                if (extractResultCheck() == 'BINGO') socket.emit('bingo', currentPlayer);
            });
        }

        let extractResultCheck = () => {
            let extracted = Array.from(document.getElementsByClassName('extracted'));
            extracted = extracted.map(val => {return parseInt(val.innerHTML)});
            return currentPlayer.card.checkBingo(currentPlayer.card.getMatrix(), ballsExtracted, undefined, undefined, extracted);
        }

        /* Create publish/subscriber mechanism useful to be aware of some interesting bingo events like linia or bingo */
        pubSub = new PubSub();
        /* Create and render empty bombo for our playing */
        bombo = new Bombo(document.getElementById('balls'));
        /* Change app state from stop to run  */
        stateApp = "run";

        subscribeServices(isOnline);
    }

    let subscribeServices = (isOnline = false) => {
        /* Subscribe app to LINIA event. When this occurs
        we show up a modal with the player awarded and a gif animation 
        obviously we stop bingo playing until modal is closed 
        */
        pubSub.subscribe("LINIA", (player) => {
            debug("Linia");
            /* Stop bingo playing */
            stop();
            /* As linia only could be awarded once per playing we delete that event
            from publish/subscriber mechanism */
            pubSub.unsubscribe("LINIA");
            /* Show modal */
            setTimeout(function () {
                showModal(modalLiniaBingo(player, "linea"), function () {
                    debug("SPEEEED");
                    debug(app.speed);
                    !isOnline && (myApp = setInterval(getBallFromBombo, app.speed));
                }, false)
            }, 50);

        });
        /* Subscribe app to BINGO event. When this occurs
        we show up a modal with the player awarded and a gif animation 
        obviously we stop bingo playing until modal is closed 
        */
        pubSub.subscribe("BINGO", (player) => {
            stop();
            /* call audio song to enhance bingo prize experience*/
            setupAudioBingoWin();
            /* Show bingo modal with animation and player awarded */
            setTimeout(function () {
                /* Delete BINGO event from publish/subscriber mechanism */
                pubSub.unsubscribe("BINGO");
                // clearModal("bingoCard") BUG
                showModal(modalLiniaBingo(player, "bingo"), function () {
                    document.getElementById('sound').remove();//remove div audio sound
                    showModal(modalPlayers(), app.offline);

                }, false);
            }, 50);

        });
    }

    /* Return start and stop function and play speed */
    return {
        offline: offline,
        online: online
        ,
        toggle: () => {
            (stateApp == "run") ? stop() : offline();
        },
        speed: speed
    };

})();
/* Real entry point to our bingo app. Show modals to choose players and
 when closed start bingo playing (callback) */
docReady(() => showModal(modalMainMenu()));


export { app };