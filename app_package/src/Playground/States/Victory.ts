import { Button, StackPanel, TextBlock } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GameState } from "./GameState";
import { InputManager } from "../Inputs/Input";
import { Nullable } from "@babylonjs/core";
import { Ship, Statistics } from "../Ship";
import { Parameters } from "../Parameters";

export class Victory extends State {
    public ship: Nullable<Ship> = null;
    public exit() {
        super.exit();
    }

    public enter() {
        super.enter();
        if (!this._adt) {
            return;
        }
        GameState.gameSession?.pause();
        InputManager.disablePointerLock();
        var panel = new StackPanel();

        this._addText("Victory! All your base are belong to us!", panel);
        if (this.ship && this.ship.statistics) {
            const s = this.ship.statistics;
            this._addText("Damage dealt: " + s.damageDealt, panel);
            this._addText("Damage taken: " + s.damageTaken, panel);
            this._addText("Ships destroyed: " + s.shipsDestroyed, panel);
            this._addText("Time of battle: " + Math.round(s.timeOfBattle/1000)+" seconds", panel);
            this._addText("Shots fired: " + s.shotFired, panel);
            this._addText("Shots hitting: " + s.shotHitting, panel);
            this._addText("Missiles fired: " + s.missilesFired, panel);
            this._addText("Allies Asteroid Crash: " + Statistics.alliesCrash, panel);
            this._addText("Enemies Asteroid Crash: " + Statistics.enemiesCrash, panel);
        }

        let buttons:any = [];
        var button = Button.CreateSimpleButton("but", "Next Battle".toUpperCase());
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        buttons.push(button);
        panel.addControl(button);

        var button2 = Button.CreateSimpleButton("but", "Main menu".toUpperCase());
        button2.width = 0.2;
        button2.height = "40px";
        button2.color = "white";
        button2.background = "grey";
        buttons.push(button2);
        panel.addControl(button2);

        button.onPointerDownObservable.add(function(info) {
            GameState.gameSession?.stop();
            State.setCurrent(States.gameState);
        });

        button2.onPointerDownObservable.add(function(info) {
            GameState.gameSession?.stop();
            State.setCurrent(States.main);
        });

        for (let index in buttons) {
            Parameters.setFont(buttons[index], true);
        }

        this._adt.addControl(panel);
    }
}