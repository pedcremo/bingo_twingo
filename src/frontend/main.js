import './css/style.css';
import './css/ingame.css';
import './css/header.css'
import { docReady, showModal } from './js/core.js';
import { modalMainMenu } from './js/templates/modalMainMenu.js';
import { setupLanguage } from './js/utils'
import { routes } from './routes'


/* Real entry point to our bingo app. Show modals to choose players and
 when closed start bingo playing (callback) */

docReady(() => {

   // Load application routes
   routes();
   setupLanguage();
   showModal(modalMainMenu());
});