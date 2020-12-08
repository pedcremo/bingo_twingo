import '../../css/modalLobbyPlayers.css';
import { onlineMode } from '../onlineMode';

/*
In this modal we show who has been connected to the online bingo game
and what is left in seconds before playing starts
*/


/* Players who are joining the game */
let renderPlayersLobby = (parsedData) => {
    console.log("rendering");
    let playersDiv = document.getElementById('listLobbyPlayers');
    playersDiv.innerHTML = '';
    parsedData.players.map((player) => {
        let doc = new DOMParser().parseFromString(`
            <li> Player: ${player.username} &nbsp; - &nbsp; Lv: 8 &nbsp; - &nbsp; Wins : 0
                <div class="lobby__card">
                    <table class='lobby__card__table'>
                        `+
                        player.card.map((value) =>
                            "<tr>" + value.map((val) => {
                                if (val == null) {
                                    return "<th class='null'></th>"
                                } else {
                                    return "<th>" + val + "</th>"
                                }
                            }).join("")
                            + "</tr>"
                        ).join("") +
                    `</table>
                </div>
            </li>
        `, 'text/html');
        playersDiv.appendChild(doc.body.firstChild)
    })   
}

/* Main modal */
export const modalLobbyPlayers = () => {

    const controllers = () => {
        let timer = document.getElementById('time_count');

        let intervalTimer = setInterval(() => {
            let time = timer.innerText;
            let current = (time - 1);            
            timer.innerText = current;
        }, 1000);

        onlineMode.setModalLobby(renderPlayersLobby, intervalTimer, timer)
    }

    return {
        template:
            `
            <div id="mainMenu" class="modal">
                <!-- Modal content -->
                <div class="modal-content">
                    <h1>BINGO TWINGO</h1>
                    <p></p>
                    <span class="time_left">Time left: <span id="time_count"></span></span>
                    <div class='lobby__players__list'>
                        <ol id="listLobbyPlayers"></ol>
                    </div>
                    
                    <div class='lobby__messages'>
                        <span>Chat Messages</span>
                        <ol id="listLobbyMessages"></ol>
                    </div>
                    
                </div>
            </div>`,
        controllers: controllers
    }
}