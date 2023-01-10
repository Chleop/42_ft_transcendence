import { GameScene } from "./game/game";
import { MainMenuScene } from "./main_menu/main_menu";

export const Scenes = (function () {
    class SceneClass {
        private main_menu_: MainMenuScene;
        private game_: GameScene;

        public initialize() {
            this.main_menu_ = new MainMenuScene();
            this.game_ = new GameScene();
            this.game_.show_debug = true;
        }

        public get main_menu(): MainMenuScene {
            return this.main_menu_;
        }

        public get game(): GameScene {
            return this.game_;
        }
    }

    return new SceneClass();
})();
