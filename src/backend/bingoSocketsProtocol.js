import { gameController } from './gameController'
import { PubSub } from '../common/pubSub.js';
//import BingoCard from '../common/bingoCard'
import { BingoCard } from '../common/bingoCard.js';


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
    //console.log("NEVER REACHED");
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
        card:bingoCard.getMatrix()
      }
     
      game=gameController.getCurrentGame(card_hidden,pubSub);
      //if (!game.pubSub) game.pubSub = new PubSub();
      
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
        console.log("gameID="+game.id+"starts_game ->"+JSON.stringify(data))
      });
      //The only publisher of this event is gameController
      pubSub.subscribe("new_number", (data) => {
        if (data != false) io.sockets.in(game.id).emit('new_number',data);
        console.log("gameID="+game.id+" new_number ->"+data.id+" "+data.num)
      });
      //The publishers of this event is gameController and when bingo
      //is shooted
      // pubSub.subscribe("end_game", (data) => {
      //   io.sockets.in(data).emit('end_game',data);
      // });
  
    });
  
    socket.on('disconnect',(info) => {
      console.log("DISCONNECTED");
      console.log(info);
    });
  
    socket.on('bingo',playInfo =>{
      
  
      pubSub.unsubscribe('new_number');  
      console.log("GAME INFO "+JSON.stringify(game)); 
      //console.log("bomboTimer "+game.bomboTimer);   
      //clearInterval(game.bomboTimer);
      console.log("bingo ->"+JSON.stringify(playInfo));
      io.sockets.in(game.id).emit('bingo_accepted',playInfo);
      
      //Stop throwing balls from bombo
      let gId=gameController.getGameById(game.id);
      clearInterval(gId.get('bomboInterval'));
      pubSub.publish("end_game",game.id);
      io.sockets.in(game.id).emit('end_game',game.id);
      // io.sockets.in(game.id).clients((error, socketIds) => {
      //   if (error) throw error;
      //   socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(game.id));
      // });
    });
  
    socket.on('linia',playInfo =>{
      console.log("linia ->"+JSON.stringify(playInfo));
      pubSub.publish("linea_accepted",playInfo);
      io.sockets.in(game.id).emit('linia_accepted',playInfo);
    });
    
    });
}

export {linkHttpSocketServerToApp}