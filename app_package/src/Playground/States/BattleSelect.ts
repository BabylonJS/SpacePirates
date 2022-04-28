import { Nullable } from "@babylonjs/core";
import { Button, StackPanel, TextBlock } from "@babylonjs/gui";
import { GameDefinition } from "../Game";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Assets } from "../Assets";


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

        var textBlock = new TextBlock();
        textBlock.text = "";
        textBlock.width = "300px";
        textBlock.height = "160px";
        textBlock.color = "white";
        panel.addControl(textBlock);

        Assets.missions.forEach((scenario: any) => {
            var button = Button.CreateSimpleButton("but", scenario.name);
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
            panel.addControl(button);
        });


        var button6 = Button.CreateSimpleButton("but3", "Back");
        button6.width = "100px";
        button6.height = "40px";
        button6.color = "white";
        button6.background = "grey";
        panel.addControl(button6);

        this._adt.addControl(panel);


        button6.onPointerMoveObservable.add(function(info) {
            textBlock.text = "";
        });

        button6.onPointerDownObservable.add(function(info) {
            State.setCurrent(States.main);
        });
    }
}