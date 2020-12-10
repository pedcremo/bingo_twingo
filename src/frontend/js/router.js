import { modalMainMenu } from './templates/modalMainMenu.js';
import { modalPlayers } from './templates/modalPlayers.js';
import { showModal } from './core.js';

const routes = {
    home: {
        path: "",
        template: modalMainMenu()
    },
    offline: {
        path: "offline",
        template: modalPlayers()
    },
    online: {
        path: "online",
        template: modalMainMenu()
    },
    error: {
        path: "error",
        template: ""
    }
};

export class Router {
    constructor() {
        this.paths = routes;
        console.log(this.path);
        this.getPATH();
    }

    getPATH() {
        let url = window.location.pathname;
        let route = url.substring(1) == "" ? undefined : url.substring(1);
        this.load(route);
    }

    load(page = "home") {
        debugger
        let route = this.paths[page] || this.paths.error;
        showModal(route.template);
        window.history.pushState({}, "done", route.path);
    }
}