import './css/style.css';
import './css/ingame.css';
import { docReady, showModal } from './js/core.js';
import { modalMainMenu } from './js/templates/modalMainMenu.js';

/* Real entry point to our bingo app. Show modals to choose players and
 when closed start bingo playing (callback) */

 docReady(() => showModal(modalMainMenu()));