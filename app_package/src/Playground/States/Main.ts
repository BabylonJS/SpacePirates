import { Nullable } from "@babylonjs/core";
import { Control, Button, Grid, StackPanel } from "@babylonjs/gui";
import { fireProceduralTexturePixelShader } from "@babylonjs/procedural-textures/fire/fireProceduralTexture.fragment";
import { GameDefinition } from "../Game";
import { Parameters } from "../Parameters";
import { BattleSelect } from "./BattleSelect";
import { Diorama } from "./Diorama";
import { State } from "./State";
import { States } from "./States";

export class Main extends State {

    public static diorama: Nullable<Diorama> = null;
    
    public exit() {
        super.exit();
    }

    private _addButton(label: string, panel: StackPanel): Button {
        var button = Button.CreateSimpleButton("but", label.toUpperCase());
        button.width = "300px";
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        Parameters.setFont(button, true);
        panel.addControl(button);
        return button;
    }

    public enter() {
        super.enter();

        if (!this._adt) {
            return;
        }

        Main.diorama?.setEnable(this._adt);
        
        var panel = new StackPanel();
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        let grid = new Grid();
        grid.addRowDefinition(0.6, false);
        grid.addRowDefinition(0.4, false);
        grid.addColumnDefinition(1.0, false)
        grid.addControl(panel, 1, 0);
        
        this._addButton("Single Player Battle", panel).onPointerDownObservable.add(function(info) {
            const gameDefinition = new GameDefinition();
            gameDefinition.humanAllies = 1;
            gameDefinition.aiEnemies = Parameters.enemyCount;
            gameDefinition.aiAllies = Parameters.allyCount;
            BattleSelect.gameDefinition = gameDefinition;
            State.setCurrent(States.battleSelect);
        });

        if (Parameters.allowSplitScreen) {
            this._addButton("Two Players Co-op", panel).onPointerDownObservable.add(function(info) {
                const gameDefinition = new GameDefinition();
                gameDefinition.humanAllies = 2;
                gameDefinition.aiEnemies = Parameters.enemyCount;
                gameDefinition.aiAllies = Parameters.allyCount;
                BattleSelect.gameDefinition = gameDefinition;
                State.setCurrent(States.battleSelect);
            });
            this._addButton("Two Players Vs", panel).onPointerDownObservable.add(function(info) {
                const gameDefinition = new GameDefinition();
                gameDefinition.humanAllies = 1;
                gameDefinition.humanEnemies = 1;
                gameDefinition.aiEnemies = Parameters.enemyCount;
                gameDefinition.aiAllies = Parameters.allyCount;
                BattleSelect.gameDefinition = gameDefinition;
                State.setCurrent(States.battleSelect);
            });

        }

        this._addButton("Options", panel).onPointerDownObservable.add(function(info) {
            States.options.backDestination = States.main;
            State.setCurrent(States.options);
        });

        this._addButton("Credits", panel).onPointerDownObservable.add(function(info) {
            State.setCurrent(States.credits);
        });
        this._adt.addControl(grid);
    }
}