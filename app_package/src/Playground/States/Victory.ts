import { Control, Grid, StackPanel, TextBlock } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GameState } from "./GameState";
import { InputManager } from "../Inputs/Input";
import { Nullable } from "@babylonjs/core";
import { Ship, Statistics } from "../Ship";
import { GuiFramework } from "../GuiFramework";

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

        if (GuiFramework.isLandscape) {
            GuiFramework.createBottomBar(this._adt);
            let stats = GuiFramework.createRecapGrid();
            let panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);
            let panelGrid: Grid = GuiFramework.createTextPanel(grid);
            GuiFramework.createPageTitle("Victory", panelGrid);
            grid.addControl(stats, 0, 1);
    
            const splashText = GuiFramework.createSplashText("All your base are belong to us!");
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
    
            GuiFramework.addButton("Next Battle", panel).onPointerDownObservable.add(function(info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.gameState);
            });
    
            GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function(info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.main);
            });
    
            this._adt.addControl(grid);

        } else {
            let panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            panel.paddingBottom = "100px";
            let grid = new Grid();
            grid.addRowDefinition (0.2, false);
            grid.addRowDefinition (0.5, false);
            grid.addRowDefinition (0.3, false);
            grid.addControl(panel, 2, 0);
            let textBlock = new TextBlock("", "VICTORY");
            GuiFramework.setFont(textBlock, true, true);
            textBlock.fontSize = 35;
            textBlock.color = "#a6fffa";
            textBlock.horizontalAlignment =  Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(textBlock, 0, 0);
        
            const statsGrid = GuiFramework.createStatsGrid();
            grid.addControl(statsGrid, 1, 0);
    
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
    
            GuiFramework.addButton("Next Battle", panel).onPointerDownObservable.add(function(info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.gameState);
            });
    
            GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function(info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.main);
            });
    
            this._adt.addControl(grid);
        }
    }
}