import { Nullable } from "@babylonjs/core";
import { Control, Grid, StackPanel, TextBlock } from "@babylonjs/gui";
import { GameDefinition } from "../Game";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Assets } from "../Assets";
import { GuiFramework } from "../GuiFramework";

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

        GuiFramework.createBottomBar(this._adt);
        var panel = new StackPanel();
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        let grid = new Grid();
        GuiFramework.formatButtonGrid(grid);
        grid.addControl(panel, 0, 0);
        GuiFramework.createTextPanel(grid);
        
        Assets.missions.forEach((scenario: any) => {
            let button = GuiFramework.addButton(scenario.name, panel)
            button.onPointerMoveObservable.add(() => {
                textBlock.text = scenario.description;
            });
            button.onPointerDownObservable.add(() => {
                GameState.gameDefinition = scenario.gameDefinition;
                State.setCurrent(States.gameState);
            })
        });

        let button = GuiFramework.addButton("Back", panel);
        button.onPointerMoveObservable.add(function(info) {
            textBlock.text = "";
        });
        button.onPointerDownObservable.add(function(info) {
            State.setCurrent(States.main);
        });

        let textBlock = new TextBlock();
        textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.text = "";
        textBlock.width = "300px";
        textBlock.height = "160px";
        textBlock.color = "white";
        grid.addControl(textBlock, 0, 1);

        this._adt.addControl(grid);
    }
}