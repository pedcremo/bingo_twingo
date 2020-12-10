import { app } from './js/offlineMode.js';
import Router from './Router';
import { showModal } from './js/core.js';
import { modalPlayers } from './js/templates/modalPlayers.js';
import { modalAboutUs } from './js/templates/modalAboutUs.js';
import { modalMainMenu } from './js/templates/modalMainMenu.js';
import { modalLobbyPlayers } from './js/templates/modalLobbyPlayers.js';
import io from 'socket.io-client'

let siteIP = location.host;
let socket;

export let routes = () => {
    const router = new Router({
        mode: 'hash',
        root: '/'
    });
    
    router
        .add(/offline/, () => {
            if (socket) socket.disconnect();
            showModal(modalPlayers(), app.start);
        })
        .add(/join-online/, () => {
            let username = window.prompt('Username:');
            (username != undefined && username != null && username != '') ? location.href = '/#/online/'+username : location.href = '/#/'
        })
        .add(/online\/(.*)/, (username) => joinGame(username))

        .add(/about/, () => {
            if (socket) socket.disconnect();
            showModal(modalAboutUs());
        })
        .add('', () => {
            if (socket) socket.disconnect();
            showModal(modalMainMenu());
        })
}

let joinGame = (username) => {
    if (socket) socket.disconnect();
    localStorage.setItem('onlineUsername', username)
    const socketio = io('ws://' + siteIP, { transports: ['websocket'] });
    socket = socketio
    socketio.on('connect', () => {
        socketio.emit('join', username);
    });

    socketio.on('joined_game', function (msg) {
        let card = JSON.parse(msg)
        showModal(modalLobbyPlayers(socketio, card))
    });
}