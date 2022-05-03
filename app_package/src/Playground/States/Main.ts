import { Nullable } from "@babylonjs/core";
import { Control, Grid, StackPanel } from "@babylonjs/gui";
import { ControlTreeItemComponent } from "@babylonjs/inspector/components/sceneExplorer/entities/gui/controlTreeItemComponent";
import { fireProceduralTexturePixelShader } from "@babylonjs/procedural-textures/fire/fireProceduralTexture.fragment";
import { GameDefinition } from "../Game";
import { Parameters } from "../Parameters";
import { BattleSelect } from "./BattleSelect";
import { Diorama } from "./Diorama";
import { State } from "./State";
import { States } from "./States";
import { GuiFramework } from "../GuiFramework";

export class Main extends State {

    public static diorama: Nullable<Diorama> = null;
    
    public exit() {
        super.exit();
    }

    public enter() {
        super.enter();

        if (!this._adt) {
            return;
        }

        Main.diorama?.setEnable(this._adt);

        GuiFramework.createBottomBar(this._adt);
        var panel = new StackPanel();
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        let grid = new Grid();
        grid.paddingBottom = "100px";
        grid.paddingLeft = "100px";
        GuiFramework.formatButtonGrid(grid);
        grid.addControl(panel, 0, 0);

        GuiFramework.addButton("Play", panel).onPointerDownObservable.add(function(info) {
            const gameDefinition = new GameDefinition();
            gameDefinition.humanAllies = 1;
            gameDefinition.aiEnemies = Parameters.enemyCount;
            gameDefinition.aiAllies = Parameters.allyCount;
            BattleSelect.gameDefinition = gameDefinition;
            State.setCurrent(States.battleSelect);
        });
        
        if (Parameters.allowSplitScreen) {
            GuiFramework.addButton("Two Player Co-op", panel).onPointerDownObservable.add(function(info) {
                const gameDefinition = new GameDefinition();
                gameDefinition.humanAllies = 2;
                gameDefinition.aiEnemies = Parameters.enemyCount;
                gameDefinition.aiAllies = Parameters.allyCount;
                BattleSelect.gameDefinition = gameDefinition;
                State.setCurrent(States.battleSelect);
            });

            GuiFramework.addButton("Two Players Vs", panel).onPointerDownObservable.add(function(info) {
                const gameDefinition = new GameDefinition();
                gameDefinition.humanAllies = 1;
                gameDefinition.humanEnemies = 1;
                gameDefinition.aiEnemies = Parameters.enemyCount;
                gameDefinition.aiAllies = Parameters.allyCount;
                BattleSelect.gameDefinition = gameDefinition;
                State.setCurrent(States.battleSelect);
            });
        }

        GuiFramework.addButton("Options", panel).onPointerDownObservable.add(function(info) {
            States.options.backDestination = States.main;
            State.setCurrent(States.options);
        });

        GuiFramework.addButton("Credits", panel).onPointerDownObservable.add(function(info) {
            State.setCurrent(States.credits);
        });
        this._adt.addControl(grid);
    }
}