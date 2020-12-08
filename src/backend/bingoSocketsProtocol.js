import { gameController } from './gameController'
import { PubSub } from '../common/pubSub.js';
//import BingoCard from '../common/bingoCard'
import { BingoCard } from '../common/bingoCard.js';
let settings = require('../settings.js')



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

    socket.on('number_press',(info)=>{
      io.sockets.in(info.playId).emit('print_numbers',info);
    })
  
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
  
      //When a player sends the line the server checks it and if it is valid it sends it to the whole room.
      socket.on('linia_bingo_check',playInfo =>{
        //first we check that the game mode is manual
        if(settings.manualGame){
          let bingo = true;
          let line_status = false;
          let line_failed = true;
          //scan the cardmatrix to check if the line is correct.
          playInfo.card.cardMatrix.forEach((row) => {
            let linia = row.filter((val) => { if (!playInfo.extractedBalls.includes(val['number']) && val['number'] != null) return val['number'] }).length;
            if (linia > 0 && line_status==false){
              bingo = false;
            }else {
              console.log("linea accepted");
              if(!line_status && playInfo.type=='line'){
                pubSub.publish("linea_accepted",playInfo);
                io.sockets.in(playInfo.playId).emit('linia_accepted',playInfo);
                line_status=true;
              }
              line_failed=false;
            }  
          })
          if(line_failed){
            console.log("linea failed");
            io.sockets.in(playInfo.playId).emit('linia_failed',playInfo);
          }
          if (bingo && playInfo.type=='bingo') {
            pubSub.unsubscribe('new_number'); 
            io.sockets.in(playInfo.playId).emit('bingo_accepted',playInfo);
            let gId=gameController.getGameById(playInfo.playId);
            clearInterval(gId.get('bomboInterval'));
            pubSub.publish("end_game",playInfo.playId);
            io.sockets.in(playInfo.playId).emit('end_game',playInfo.playId);
          }
        }else{
          //if the manual mode is off
          if(playInfo.type=='bingo'){
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
          }else{
            console.log("linia ->"+JSON.stringify(playInfo));
            pubSub.publish("linea_accepted",playInfo);
            io.sockets.in(game.id).emit('linia_accepted',playInfo);
          }
        }

      });
    
    });
}

export {linkHttpSocketServerToApp}