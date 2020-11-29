/**
 * In the Bombo class is where we have all the balls of the bingo in const templateBombo, there storatge the 90 balls in an array
 * en boles.
 * 
 * We store a copy of the templatebombo array so as not to have to modify the original, 
 * so in all the actions that we use the balls of the bombo we do it with the copy of the array.
 * 
 * And also  we extract the balls randomly using the pickNumber method
 * 
 * Let render is used to paint the balls of the bombo
 */

export class Bombo{    
    
    //If rootElement (DOM) is not undefined means bombo is used in frontend 
    constructor(rootElement=undefined){
        const templateBombo = Array.from({length:90},(_,i) => i + 1);
        let boles = [...templateBombo];
        let bolesExtracted = [];
        let lastBall;
        let shuffle = () => boles.sort((a,b) => Math.random()-0.5);         
        this.getExtractedNumbers= () =>  bolesExtracted;
        this.getRemainingBoles = () => boles;
        this.pickNumber = () => {
            shuffle();             
            boles[0] && bolesExtracted.push(boles[0]);  
            if (rootElement && boles[0]){
                //si existe una ultima bola le quitamos la animacion
                if(lastBall){
                    document.getElementById(lastBall).className = 'bingoBall';
                }
                //a la bola actual le ponemos la animacion
                document.getElementById(boles[0]).className = 'bingoBall blink'

                lastBall = boles[0];
            }                             
            return (boles.length>0 && boles.splice(0,1))?bolesExtracted[bolesExtracted.length-1]:false;            
        }
        //el render solo lo realiza una vez (añadiendo id a cada bola)
        let render = () => {            
            if (rootElement) rootElement.innerHTML += `${boles.map(ball => `<div class='bingoBallEmpty' id='${ball}'>${ball}</div>`).join("")}`;
        }
        if (rootElement) render() //Only rendered if rootElement is not undefined
    }   
}
