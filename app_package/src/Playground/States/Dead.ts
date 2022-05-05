import { Control, Grid, StackPanel } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GameState } from "./GameState";
import { Nullable } from "@babylonjs/core";
import { Ship, Statistics } from "../Ship";
import { InputManager } from "../Inputs/Input";
import { GuiFramework } from "../GuiFramework";

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

        GuiFramework.createBottomBar(this._adt);
        let stats = GuiFramework.createRecapGrid();
        var panel = new StackPanel();
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        let grid = new Grid();
        grid.paddingBottom = "100px";
        grid.paddingLeft = "100px";
        GuiFramework.formatButtonGrid(grid);
        grid.addControl(panel, 0, 0);
        let panelGrid: Grid = GuiFramework.createTextPanel(grid);
        GuiFramework.createPageTitle("Defeat", panelGrid);
        grid.addControl(stats, 0, 1);

        const splashText = GuiFramework.createSplashText("Wasted!!!");
        stats.addControl(splashText, 0, 0);

        const statsGrid = GuiFramework.createStatsGrid();
        stats.addControl(statsGrid, 1, 0);

        if (this.ship && this.ship.statistics) {
            const s = this.ship.statistics;
            GuiFramework.createParameter(statsGrid, "Damage dealt", GuiFramework.createStatText(s.damageDealt as unknown as string));
            GuiFramework.createParameter(statsGrid, "Damage taken", GuiFramework.createStatText(s.damageTaken as unknown as string));
            GuiFramework.createParameter(statsGrid, "Ships destroyed", GuiFramework.createStatText(s.shipsDestroyed as unknown as string));
            let minutes = Math.floor(Math.round(s.timeOfBattle/1000)/60);
            let seconds = Math.floor((Math.round(s.timeOfBattle/1000)/60 - minutes) * 60);
            GuiFramework.createParameter(statsGrid, "Time of battle", GuiFramework.createStatText(minutes + " min " + seconds + " sec" as unknown as string));
            GuiFramework.createParameter(statsGrid, "Shots fired", GuiFramework.createStatText(s.shotFired as unknown as string));
            let accuracy: string = (s.shotFired > 0) ? Math.round((s.shotHitting / s.shotFired) * 100) + "%" as unknown as string : "0%";
            GuiFramework.createParameter(statsGrid, "Accuracy", GuiFramework.createStatText(accuracy));
            GuiFramework.createParameter(statsGrid, "Missiles fired", GuiFramework.createStatText(s.missilesFired as unknown as string));
            GuiFramework.createParameter(statsGrid, "Allies Asteroid Crash", GuiFramework.createStatText(Statistics.alliesCrash as unknown as string));
            GuiFramework.createParameter(statsGrid, "Enemies Asteroid Crash", GuiFramework.createStatText(Statistics.enemiesCrash as unknown as string));
        }

        GuiFramework.addButton("Try again", panel).onPointerDownObservable.add(function(info) {
            GameState.gameSession?.stop();
            State.setCurrent(States.gameState);
        });

        GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function(info) {
            GameState.gameSession?.stop();
            State.setCurrent(States.main);
        });

        this._adt.addControl(grid);
        GuiFramework.setOrientation(this._adt);
    }
}