import { Nullable } from "@babylonjs/core";
import { Control, Grid, StackPanel, TextBlock } from "@babylonjs/gui";
import { GameDefinition } from "../Game";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Assets } from "../Assets";
import { GuiFramework } from "../GuiFramework";
import { InputManager } from "../Inputs/Input";

export class BattleSelect extends State {

    public static gameDefinition: Nullable<GameDefinition> = null;
    private static missions: any = null;

    public exit() {
        super.exit();
    }

    public enter() {
        super.enter();
        if (!this._adt) {
            return;
        }

        if (GuiFramework.isLandscape) {
            GuiFramework.createBottomBar(this._adt);
            let instructions = GuiFramework.createRecapGrid();
            var panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);
            const panelGrid: Grid = GuiFramework.createTextPanel(grid);
            GuiFramework.createPageTitle("Mission Select", panelGrid);
            grid.addControl(instructions, 0, 1);
    
            const splashText = GuiFramework.createSplashText("");
            instructions.addControl(splashText, 0, 0);
    
            const inputControls = GuiFramework.createStatsGrid();
            instructions.addControl(inputControls, 1, 0);
    
            if (InputManager.isTouch) {
                GuiFramework.createParameter(inputControls, "Steer", GuiFramework.createStatText("Virtual Thumbstick"));
                GuiFramework.createParameter(inputControls, "Fire Cannons", GuiFramework.createStatText("Fire Button"));
                GuiFramework.createParameter(inputControls, "Fire Missile", GuiFramework.createStatText("Missile Button"));
                GuiFramework.createParameter(inputControls, "Afterburners", GuiFramework.createStatText("Boost Button"));
                GuiFramework.createParameter(inputControls, "Brake", GuiFramework.createStatText("Brake Button"));
                GuiFramework.createParameter(inputControls, "Reverse Course", GuiFramework.createStatText("Flip Button"));
            } else {
                GuiFramework.createParameter(inputControls, "Steer", GuiFramework.createStatText("Mouse"));
                GuiFramework.createParameter(inputControls, "Fire Cannons", GuiFramework.createStatText("Left Mouse Button"));
                GuiFramework.createParameter(inputControls, "Fire Missile", GuiFramework.createStatText("Right Mouse Button"));
                GuiFramework.createParameter(inputControls, "Afterburners", GuiFramework.createStatText("W"));
                GuiFramework.createParameter(inputControls, "Brake", GuiFramework.createStatText("S"));
                GuiFramework.createParameter(inputControls, "Reverse Course", GuiFramework.createStatText("Q"));
            }
            
            Assets.missions.forEach((scenario: any) => {
                let button = GuiFramework.addButton(scenario.name, panel)
                button.onPointerMoveObservable.add(() => {
                    splashText.text = scenario.description;
                });
                button.onPointerDownObservable.add(() => {
                    GameState.gameDefinition = scenario.gameDefinition;
                    State.setCurrent(States.gameState);
                })
            });
    
            let button = GuiFramework.addButton("Back", panel);
            button.onPointerMoveObservable.add(function(info) {
                splashText.text = "";
            });
            button.onPointerDownObservable.add(function(info) {
                State.setCurrent(States.main);
            });
    
            this._adt.addControl(grid);

        } else {
            let grid = new Grid();
            grid.addRowDefinition(0.2, false);
            grid.addRowDefinition(0.8, false);
            grid.addColumnDefinition(1.0, false);
            let textBlock = new TextBlock("", "MISSION SELECT");
            GuiFramework.setFont(textBlock, true, true);    
            textBlock.fontSize = 35;
            textBlock.color = "#a6fffa";
            textBlock.horizontalAlignment =  Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(textBlock, 0, 0);
    
            const splashText = GuiFramework.createSplashText("");
            splashText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            grid.addControl(splashText, 1, 0);
                
            var panel = new StackPanel();
            panel.paddingBottom = "100px";
            Assets.missions.forEach((scenario: any) => {
                let button = GuiFramework.addButton(scenario.name, panel)
                button.onPointerMoveObservable.add(() => {
                    splashText.text = scenario.description;
                });
                button.onPointerDownObservable.add(() => {
                    GameState.gameDefinition = scenario.gameDefinition;
                    State.setCurrent(States.gameState);
                })
            });
    
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let button = GuiFramework.addButton("Back", panel);
            button.onPointerMoveObservable.add(function(info) {
                splashText.text = "";
            });
            button.onPointerDownObservable.add(function(info) {
                State.setCurrent(States.main);
            });
            grid.addControl(panel, 2, 0);

            this._adt.addControl(grid);

        }
    }
}