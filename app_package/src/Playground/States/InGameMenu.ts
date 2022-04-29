import { Button, StackPanel } from "@babylonjs/gui";
import { InputManager } from "../Inputs/Input";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Parameters } from "../Parameters";

export class InGameMenu extends State {

    public exit() {
        super.exit();
    }

    public enter() {
        super.enter();

        if (!this._adt) {
            return;
        }

        GameState.gameSession?.pause();
        let buttons = [];

        var panel = new StackPanel();
        var button = Button.CreateSimpleButton("but", "Return to battle".toUpperCase());
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        buttons.push(button);
        panel.addControl(button);
    
        var button2 = Button.CreateSimpleButton("but2", "Options".toUpperCase());
        button2.width = 0.2;
        button2.height = "40px";
        button2.color = "white";
        button2.background = "grey";
        buttons.push(button2);
        panel.addControl(button2);

        const game = GameState.gameSession?.getGame();
        if (game && game.humanPlayerShips.length == 1 && Parameters.recorderActive) {
            var button3 = Button.CreateSimpleButton("but3", "Photo mode".toUpperCase());
            button3.width = 0.2;
            button3.height = "40px";
            button3.color = "white";
            button3.background = "grey";
            buttons.push(button3);
            panel.addControl(button3);

            button3.onPointerDownObservable.add(function(info) {
                State.setCurrent(States.photoMode);
            });
        }

        var button4 = Button.CreateSimpleButton("but4", "Back to menu".toUpperCase());
        button4.width = 0.2;
        button4.height = "40px";
        button4.color = "white";
        button4.background = "grey";
        buttons.push(button4);
        panel.addControl(button4);

        for (let index in buttons) {
            Parameters.setFont(buttons[index], true);
        }

        this._adt.addControl(panel);

        button.onPointerDownObservable.add(function(info) {
            InputManager.setupPointerLock();
            State.setCurrent(States.gameState);
        });

        button2.onPointerDownObservable.add(function(info) {
            States.options.backDestination = States.inGameMenu;
            State.setCurrent(States.options);
        });

        button4.onPointerDownObservable.add(function(info) {
            GameState.gameSession?.stop();
            State.setCurrent(States.main);
        });
    }
}