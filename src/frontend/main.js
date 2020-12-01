
import './css/style.css';
import './css/ingame.css';
import { docReady, showModal, clearModal, debug } from './js/core.js';
import { Bombo } from '../common/bombo.js';
import { BingoCard } from '../common/bingoCard.js';
import { PubSub } from '../common/pubSub.js';
import { modalPlayers, setupAudioBingoWin } from './js/templates/modalPlayers.js';
import { modalLiniaBingo } from './js/templates/modalLiniaBingo.js';
import { modalMainMenu } from './js/templates/modalMainMenu.js';
import { settings } from '../settings';

/**
 * Within the app constant(closure), we have defined several variables with anonymous functions which are responsible for starting and stopping the game
 * As for the start variable, it is where we have the subscription patterns, 
 * and it goes down for the line and the bingo, so that when one player gets a 'line', the others can no longer and in the case of bingo,
 * when one player sings bingo the game stops and in addition to showing a modal with a gif, an audio jumps with a voice that sings BIINGO.
 */

const app = (() => {      
    let myApp;
    const speed = settings.ballspeed; //in miliseconds
    let bombo;
    let players = []
    let pubSub = new PubSub();
    let stateApp = "stop";

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
        debugger
        clearInterval(myApp);
    }
    let resume = () => {
        stateApp = "run";
        myApp = setInterval(getBallFromBombo, app.speed);
    }
    /* Start bingo play */
    let start = () => {
        clearModal('bg');
        
        /* Basic template where we are going to render bingo play */
        let doc = new DOMParser().parseFromString(`
            <div id="gameLayout" class="gameLayout">
                <div id="bingoCards" class="cards"></div>
                <div class="panel">
                    <div id="balls" class="balls__grid"></div>
                </div>
                <div class="blackPanel" id="blackPanel"></div>
                <a class="pauseOfflineBtn" id="pauseOfflineBtn"><i class="fas fa-pause"></i></a>
            </div>
        `, 'text/html');

        let layout = doc.body.firstChild;
        document.getElementById('main').appendChild(layout);

        /* Layer where initial background video has been loaded we
        need to remove it as we are going to start playing */
        let videoEl = document.getElementById('videoBackground');
        if (videoEl) videoEl.remove();

        /* Create publish/subscriber mechanism useful to be aware of some interesting bingo events like linia or bingo */
        pubSub = new PubSub();
        /* Create and render empty bombo for our playing */
        bombo = new Bombo(document.getElementById('balls'));
        

        /* Change app state from stop to run  */
        stateApp = "run";
        let pauseBtn = document.getElementById('pauseOfflineBtn');
        let blackPanel = document.getElementById('blackPanel')
        pauseBtn.onclick = function() {                       
            if (stateApp == "stop") {
                blackPanel.style.display = "none"
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>'
                resume();
            }else {
                blackPanel.style.display = "unset"
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>'
                stop();
            }
        }
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
                    debug(speed);
                    myApp = setInterval(getBallFromBombo, app.speed);
                },false)
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
                    showModal(modalMainMenu());
                })
            }, 50);


        });
        players = [];
        /* Get players names from browser localStorage */
        let playersNames = JSON.parse(localStorage.getItem('playersNames'));
        /* Clear html layer reserved for render bingo cards */
        document.getElementById('bingoCards').innerHTML = ""
        /* Create one bingo card for every bingo player */
        playersNames.forEach(name => {
            players.push(new BingoCard(name, document.getElementById('bingoCards'), pubSub));
        });
        /* Start throwing first ball from bombo. Here we go */
        getBallFromBombo();
        /* Timer in charge to pace time between balls extraction from bombo */
        debugger
        myApp = setInterval(getBallFromBombo, app.speed);
    }

    /* Return start and stop function and play speed */
    return {
        start: start
        ,
        toggle: () => {
            (stateApp == "run") ? stop() : start();
        },
        speed: speed
    };

})();
/* Real entry point to our bingo app. Show modals to choose players and
 when closed start bingo playing (callback) */
 docReady(() => showModal(modalMainMenu()));

export { app };