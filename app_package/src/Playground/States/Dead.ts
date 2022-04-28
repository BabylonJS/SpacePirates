import { Button, StackPanel, TextBlock } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GameState } from "./GameState";
import { Nullable } from "@babylonjs/core";
import { Ship, Statistics } from "../Ship";
import { InputManager } from "../Inputs/Input";

export class Dead extends State {
    public ship: Nullable<Ship> = null;
    public exit() {
        super.exit();
    }

    public enter() {
        super.enter();
        if (!this._adt) {
            return;
        }

        InputManager.disablePointerLock();
        var panel = new StackPanel();

        this._addText("Wasted !!!", panel);
        if (this.ship && this.ship.statistics) {
            const s = this.ship.statistics;
            this._addText("Damage dealt :" + s.damageDealt, panel);
            this._addText("Damage taken :" + s.damageTaken, panel);
            this._addText("Ships destroyed :" + s.shipsDestroyed, panel);
            this._addText("Time of battle :" + Math.round(s.timeOfBattle/1000)+" seconds", panel);
            this._addText("Shots fired :" + s.shotFired, panel);
            this._addText("Shots hitting :" + s.shotHitting, panel);
            this._addText("Missiles fired :" + s.missilesFired, panel);
            this._addText("Allies Asteroid Crash: " + Statistics.alliesCrash, panel);
            this._addText("Enemies Asteroid Crash: " + Statistics.enemiesCrash, panel);
        }

        var button = Button.CreateSimpleButton("but", "Try again");
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        panel.addControl(button);

        var button2 = Button.CreateSimpleButton("but", "Main menu");
        button2.width = 0.2;
        button2.height = "40px";
        button2.color = "white";
        button2.background = "grey";
        panel.addControl(button2);

        button.onPointerDownObservable.add(function(info) {
            GameState.gameSession?.stop();
            State.setCurrent(States.gameState);
        });

        button2.onPointerDownObservable.add(function(info) {
            GameState.gameSession?.stop();
            State.setCurrent(States.main);
        });

        this._adt.addControl(panel);
    }
}