import video from '../assets/videos/los_bingueros.mp4';
import audio from '../assets/audios/Bingo Sound Effect.mp3';
import {ChooseLang} from './core'

/**
* It's a function that when any player win the bingo  there is a background audio that sings bingo!!
* This function I'll  imported it into index and called it in  pubSub.subscribe("BINGO")
*/
export function setupAudioBingoWin() {
    let audioBackground = `
        <div id="sound">
            <audio controls autoplay loop id="bingoSound">
                  <source src="${audio}" type="audio/mpeg">
             </audio>
        </div>
        `;
    let parser = new DOMParser();
    let bingoAudio = parser.parseFromString(audioBackground, "text/html");

    bingoAudio = bingoAudio.body.firstChild;
    bingoAudio.currentTime = Math.round(Math.random() * 10);
    document.body.appendChild(bingoAudio);
}

/**
 * Set the backgroundVideo 
 */
export function setupBackgroundVideo() {
    let backgroundVideo = `
        <div id="div_bg" class="bg">
            <video autoplay muted loop id="videoBackground">
                <source src="${video}" type="video/mp4">
                Your browser does not support HTML5 video.
            </video>
            <i class="fas fa-video-slash btn--removebg" id="remove_video"></i>
            <i class="fas fa-volume-mute btn--mute off--red" id="unmuteBtn"></i>
        </div>`;
    let parser = new DOMParser();
    let videoEl = parser.parseFromString(backgroundVideo, "text/html");
    videoEl.currentTime += Math.round(Math.random()*400);
    videoEl = videoEl.body.firstChild;
    document.body.appendChild(videoEl);
    

    let remove_video = document.getElementById('remove_video');

    //We get the video
    let VideoOnly = document.getElementById('videoBackground');

    //We add the atribute preload with metadata
    VideoOnly.preload = 'metadata';
    
    //When loading the metadata we obtain the maximum duration of the video and we do a random math between 0 and that value
    VideoOnly.onloadedmetadata = function() {
        VideoOnly.currentTime = Math.round(Math.random()*VideoOnly.duration);
    }
    
    /**
     * Mute and unmute the background video button
     */

    let unmuteBtn = document.getElementById('unmuteBtn');
    let videoDOM = document.getElementById('videoBackground');
    unmuteBtn.onclick = function () {
        videoDOM.muted = !videoDOM.muted;
        this.className = (videoDOM.muted == true) ? "fas fa-volume-mute btn--mute off--red" : "fas fa-volume-off btn--mute"
    }

    /**
     * Remove / show video background
     */

    remove_video.onclick = function () {
        if (this.classList.contains('off--red')) {
            this.className = "fas fa-video-slash btn--removebg"
            videoDOM.style.display = "block";
        } else {
            this.className = "fas fa-video-slash btn--removebg off--red"
            videoDOM.style.display = "none";
        }
    }
}
//CHECK NAME FUNCTION
export let checkName = (name) => {
    let regEx = /[aA1-zZ9]/;
    if (regEx.test(name)) {
        return true;
    } else {
        return false;
    }
}


/**
 * RENDERS BINGO BOMBO AND BINGO CARD
 */
//Render bingo bombo
export let renderBalls = () => {
    document.getElementById('balls').innerHTML = `${Array.from({length:90},(_,i) => i + 1).map(ball => `<div class='bingoBallEmpty' id='${ball}'>${ball}</div>`).join("")}`;
}

/**
 * Function that contains the select options languages
 */

export let setChangeLang = () =>{
    let langOptions = `
        <section class="lang-section">
            <select name="Language" id="lang" class="select-languages">
                <option   value="en" id="btn-en" data-tr="English" data-img_src="../assets/images/en.jpg">English</option>
                <option data-img_src="../assets/images/es.jpg"  value="es" id="btn-es" data-tr="Spanish">Spanish</option>   
            </select>
        </section>`;
    let parser = new DOMParser();
    let langEl = parser.parseFromString(langOptions, "text/html");
    langEl = langEl.body.firstChild;
    document.body.appendChild(langEl);
    document.getElementById('lang').addEventListener('change', function() { ChooseLang(this.value) });
}


//Render card 
export let renderCard = (extractedBalls=[],cardMatrix,player) => {
        
    let out =`<h1>Player ${player}</h1>
         <table class='bingoCard'>
            
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


export let RemoveLang = () => {
    document.getElementById('lang').remove();
}