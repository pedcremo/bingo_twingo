import { debug, clearModal, showModal } from '../core';
import { app } from '../../main.js';
import '../../css/modalMainMenu.css';
import * as utils from '..//utils.js'
import { modalLobbyPlayers } from './modalLobbyPlayers.js';
import io from 'socket.io-client'
import { modalPlayers } from './modalPlayers';

export const modalMainMenu = () => {

    const controllers = () => {
        //setup the video
        clearModal('bg')
        utils.setupBackgroundVideo();
        let siteIP = location.host;//returns the hostname and port of a URL. DOM api
        
        if (localStorage.getItem('onlineUsername') != '' || localStorage.getItem('onlineUsername') != undefined){
            document.getElementById('usernameP').value = localStorage.getItem('onlineUsername');
        }
       
        document.getElementById('playOnline').onclick = function () {
            searchGame('auto');
        }
        document.getElementById('playOnlineManual').onclick = function () {
            searchGame('manual');
        }

        function searchGame(type){
            if(utils.checkName(document.getElementById('usernameP').value)){
                let auto=true;
                localStorage.setItem('onlineUsername',document.getElementById('usernameP').value)
                const socket = io('ws://'+siteIP, {transports: ['websocket']});
                socket.on('connect', () => {

                    if(type=='manual'){
                        auto=false;
                    }
                    socket.emit('join', ({playerName:document.getElementById('usernameP').value,auto:auto}));                    

                });
    
                /* Event triggered once a user joins an 
                * online game and get a ramdom card with unique id that 
                * should not be shared
                */
                socket.on('joined_game', function (msg) {           
                    let card = JSON.parse(msg)
                    //Online game            
                    showModal(modalLobbyPlayers(socket,card))
                }); 
            }else{
                document.getElementById('msg--err').innerHTML = "\u26A0  Name not allowed!"
            }
        }

        // Offline Game
        document.getElementById('playOffline').onclick = function () {
            //Delete modal bg because it doubles
            clearModal('bg')
            showModal(modalPlayers(), app.start,true)
        }
    }

    return {
        template:
            `
            <div id="mainMenu" class="modal">
                <!-- Modal content -->
                <div class="modal-content">
                    <h1>BINGO TWINGO</h1>
                    <p></p>
                    <input class="input_player_online" type="text" id="usernameP" name="usernameP" placeholder="Online username:">
                    <p class="msg--error" id="msg--err"></p>
                    <div class="menu__options">
                        <button id='playOffline' class="mainMenu__btn menu__offline_btn">Start Offline Game</button>
                        <button id='playOnline' class="mainMenu__btn menu__online_btn">Search Online Auto Game</button>
                        <button id='playOnlineManual' class="mainMenu__btn menu__online_manual_btn">Search Online Manual Game</button>
                    </div>
                    
                </div>
            </div>`,
        controllers: controllers
    }
}