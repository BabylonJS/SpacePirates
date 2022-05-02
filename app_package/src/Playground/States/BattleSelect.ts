import { Nullable } from "@babylonjs/core";
import { Control, Grid, StackPanel } from "@babylonjs/gui";
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
        let instructions = GuiFramework.createRecapGrid();
        var panel = new StackPanel();
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        let grid = new Grid();
        GuiFramework.formatButtonGrid(grid);
        grid.addControl(panel, 0, 0);
        const panelGrid: Grid = GuiFramework.createTextPanel(grid);
        GuiFramework.createPageTitle("Mission Select", panelGrid);
        grid.addControl(instructions, 0, 1);

        const splashText = GuiFramework.createSplashText("");
        instructions.addControl(splashText, 0, 0);
        
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
    }
}