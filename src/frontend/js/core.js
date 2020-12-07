import * as es from '../assets/Languages/i18.json'
/**
 * Const setLang to specify the language
 */
const setLang = {
    es: es
}

/**
 * <!-- The Modal -->
 *   <div id="myModal" class="modal">
 * 
 *  <!-- Modal content -->
 *  <div class="modal-content">
 *    <span class="close">&times;</span>
 *     <p>Some text in the Modal..</p>
 *  </div>

 *   </div>
 *  https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal
 */

/**
 * Checks if DOM is already loades afterwards we call fn 
 * @param {*} fn 
 */
let docReady = (fn) => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        fn();
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

/**
 * Debug option
 */
const debugOption = true;

let debug = (text) => {
    if (debugOption) console.log(text);
}


let cacheModal;
 /**
  * Function ShowModal
  * This function is use to implement the diferents modal that we use in the app
  * For example  in the main page we have a modal to add players to the game,  also when  any player sing line we show a modal
  * and the same when someone sings bingo
  * @param {*} templateHtml 
  * @param {*} callback 
  */
 let showModal = (templateHtml, callback, close = true) => {
     let template = templateHtml
     if (templateHtml.template) template = templateHtml.template;
     let parser = new DOMParser();
     let modal = parser.parseFromString(template, "text/html");
 
     /* If exists another modal in cache, the current modal it's deleted before adding another one */
     if (cacheModal && close == true) document.getElementById(cacheModal).remove();
 
     Array.from(modal.body.children).forEach((item) => {
         //Remove layer If thereis in DOM a div with the same id 
         if (document.getElementById(item.id)) {
             document.getElementById(item.id).remove();
         }
 
         /* If the current modal doesn't have any ID, we add a provisional one */
 
         if (item.id == '' || item.id == null || item.id == undefined && close == true) {
             item.id = 'cacheModal'
         }
 
         /* Save the ID in cache Var */
         if (close == true) cacheModal = item.id;
 
         document.body.appendChild(item);
         if (item.className == 'modal')
             item.style.display = "block";
         // Get the <span> element that closes the modal
         let span = item.getElementsByClassName("close")[0];
         // When the user clicks on <span> (x), close the modal
         span && span.addEventListener('click', function () {
             item.style.display = "none";
             if (callback && callback != null) callback();
         });
 
     });
 
     showModal.removeCurrent = () => {
         document.getElementById(cacheModal).remove();
         cacheModal = undefined;
     }
     //Very Important.Apply controler over template defined in the same template file
     if (templateHtml.controllers) templateHtml.controllers();
     
     ChooseLang();
 }

/**

 * delete a modal
 * @param {String} templateToClear modal class 
 */
let clearModal = (templateToClear) => {
    if (document.getElementsByClassName(templateToClear)) {
        Array.from(document.getElementsByClassName(templateToClear)).forEach((el) => {
            el.remove();
        });
    }

}


 /**
  * Function ChooseLang
  * This function is used to change the language of the application.
  * If the lang it's saved in LocaStorage, we set this as default language.
  * Lang = the argument in localstoratge or english by default, here you can change the default language
  * @param {*} lang 
  */


let ChooseLang = (lang) => {
    lang = lang || localStorage.getItem('languages') || 'en'; 
    localStorage.setItem('languages', lang); //stored in localstoratge
    document.getElementById('lang').value = lang; //change current language in the  select option
    var elements = document.querySelectorAll('[data-tr]'); //get every element with data-tr attribute of ours templates literals
    if (lang != "en") {// If lang selected isn't the default option english in this case, we update it to the new lang, else,
        let chosen_language = setLang[lang].default;
        elements.forEach((el) => el.innerHTML = chosen_language["data"][el.dataset.tr])
    } else {
        elements.forEach((el) => el.innerHTML = el.dataset.tr)// the data-tr text into element
    }
}

export { docReady, showModal, clearModal, debug  , ChooseLang };

