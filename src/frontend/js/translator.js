let translations = require('../assets/translations/en-es.js');

export const translator = () => {
    const controller = () => {
        let getWordFormat = (word) => {
            let format = [];
            word.split('').map(char => format.push(char.charCodeAt(0) < 97 ? true : char.charCodeAt(0) < 97));
            return format;
        }

        let converToFormat = (word, format) => {
            word = word.split('').map((char, index) => format[index] ? char.toUpperCase() : char.toLowerCase());
            return word.join('');
        }

        let translate = (word) => {
            fetch("https://google-translate1.p.rapidapi.com/language/translate/v2", {
                "method": "POST",
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "accept-encoding": "application/gzip",
                    "x-rapidapi-key": "0c1670741bmshb8fe5fc208d835fp19ce3cjsn45fd29e2d354",
                    "x-rapidapi-host": "google-translate1.p.rapidapi.com"
                },
                "body": {
                    "q": word,
                    "source": "en",
                    "target": "es"
                }
            })
                .then(response => {
                    return response;
                })
                .catch(err => {
                    console.error(err);
                });

            // let wordFormat = getWordFormat(word);
            // if (translations[word.toLowerCase()]) return converToFormat(translations[word.toLowerCase()], wordFormat);
            // return word;
        }

        let checkElement = (element) => {
            if (element.getAttribute('i18n') !== null)
                element.innerHTML = translate(element.innerHTML);

            if (element.getAttribute('i18n-placeholder') !== null)
                element.setAttribute('placeholder', translate(element.getAttribute('placeholder')));
        }

        let run = (docElements) => {
            Array.from(docElements).map(
                element => checkElement(element))
        }

        run(document.getElementsByTagName('*'));
    }

    return {
        controller: controller,
    }
}