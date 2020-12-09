import { gameController } from './gameController'
import { PubSub } from '../common/pubSub.js';
//import BingoCard from '../common/bingoCard'
import { BingoCard } from '../common/bingoCard.js';
import { checkBingo } from '../common/checkBingo.js'


let linkHttpSocketServerToApp = (app) =>{
    const http = require('http').createServer(app)
    let io = require('socket.io')(http);
    createBingoProtocol(io);
    return http;
}

function createBingoProtocol(io){
    io.on('connect', (socket) => {
    //Only one pubSub instance per socket room 
    let pubSub = new PubSub();
    let game;
    //A player wants to join a bingo game
    socket.on('join', playerName => {
      let bingoCard = new BingoCard(playerName);
      // We create a random id in order to create a hash
      // only known by joined user in order ti avoid fake cards
      let card = {
        id:"card_id_"+playerName,
        username:playerName,
        cardMatrix:bingoCard.getMatrix(),
        checksum:"checksum card"
      }
      //Should be provided to other jooined players
      let card_hidden = {
        username: playerName,
        card: bingoCard.getMatrix(),
        pickedNums: []
      }
     
      game=gameController.getCurrentGame(card_hidden,pubSub);
      
      //The most important thing. We register socket in a room 'id'
      //that should be shared by all players on the same game
      socket.join(game.id);
      card.gameID = game.id;
      //SEND TO JOINED USER THE CARD WITH ID AND CHECKSUM
      io.to(socket.id).emit('joined_game', JSON.stringify(card));
  
      //SEND TO EVERY PLAYER IN THE GAME THAT NEW PLAYER HAS JOINED, AND ONLY THE CARDMATRIX and USERNAME
      io.sockets.in(game.id).emit('joined',JSON.stringify(game));
  
      //PUBSUB ------
      //The only publisher of this event is gameController
      pubSub.subscribe("starts_game", (data) => {
        io.sockets.in(game.id).emit('starts_game',data);
      });
      //The only publisher of this event is gameController
      pubSub.subscribe("new_number", (data) => {
        if (data != false) io.sockets.in(game.id).emit('new_number',data);
      });
      //The publishers of this event is gameController and when bingo is shooted
  
    });
  
    socket.on('disconnect',(info) => console.log("DISCONNECTED "+info) );

    // When someone marks a number in the card, we send it to every players in the room
    
    socket.on('mark_number',msg => io.sockets.in(game.id).emit('marked_number',msg) );

    // When someone clicks on bingo, we check if the bingo it's correct and we send it to every players.
    socket.on('bingo',playInfo =>{
      let gId = gameController.getGameById(playInfo.playId);
      let bombo = gId.get('bombo')
      // checkBingo is a common function (can be used in frontend or backend)
      let check = checkBingo(playInfo.card,bombo.getExtractedNumbers(), true);
      if ( check.bingo ) {
        pubSub.unsubscribe('new_number');
        pubSub.publish("end_game",game.id);
        io.sockets.in(game.id).emit('bingo_accepted',playInfo);
        clearInterval(gId.get('bomboInterval'));
        io.sockets.in(game.id).emit('end_game',game.id);
      }
    });
  
    // When someone clicks on line, we check if the line it's correct and we send it to every players, then 
    // any user will be able to send their line.
    socket.on('linia',playInfo =>{
      let gId = gameController.getGameById(playInfo.playId);
      let bombo = gId.get('bombo')
      let check = checkBingo(playInfo.card,bombo.getExtractedNumbers());
      if ( check.linea ) {
        pubSub.publish("linea_accepted",playInfo);
        io.sockets.in(game.id).emit('linia_accepted',playInfo);
      }
    });
    
    });
}

export {linkHttpSocketServerToApp}