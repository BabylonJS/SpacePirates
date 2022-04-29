import { Nullable } from "@babylonjs/core";
import { Control, Button, Grid, StackPanel, TextBlock } from "@babylonjs/gui";
import { GameDefinition } from "../Game";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Assets } from "../Assets";
import { Parameters } from "../Parameters";


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
        var panel = new StackPanel();
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        let grid = new Grid();
        grid.addRowDefinition(0.6, false);
        grid.addRowDefinition(0.4, false);
        grid.addColumnDefinition(1.0, false)
        grid.addControl(panel, 1, 0);

        let guiControls: any = [];

        Assets.missions.forEach((scenario: any) => {
            var button = Button.CreateSimpleButton("but", scenario.name.toUpperCase());
            button.width = "300px";
            button.height = "40px";
            button.color = "white";
            button.background = "grey";
            button.onPointerMoveObservable.add(() => {
                textBlock.text = scenario.description;
            });
            button.onPointerDownObservable.add(() => {
                GameState.gameDefinition = scenario.gameDefinition;
                State.setCurrent(States.gameState);
            })
            guiControls.push(button);
            panel.addControl(button);
        });


        var button6 = Button.CreateSimpleButton("but3", "Back".toUpperCase());
        button6.width = "100px";
        button6.height = "40px";
        button6.color = "white";
        button6.background = "grey";
        guiControls.push(button6);
        panel.addControl(button6);

        var textBlock = new TextBlock();
        textBlock.text = "";
        textBlock.width = "300px";
        textBlock.height = "160px";
        textBlock.color = "white";
        guiControls.push(textBlock);
        panel.addControl(textBlock);

        for (let index in guiControls) {
            Parameters.setFont(guiControls[index], true);
        }

        this._adt.addControl(grid);


        button6.onPointerMoveObservable.add(function(info) {
            textBlock.text = "";
        });

        button6.onPointerDownObservable.add(function(info) {
            State.setCurrent(States.main);
        });
    }
}