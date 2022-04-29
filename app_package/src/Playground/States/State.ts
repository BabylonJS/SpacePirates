import { AdvancedDynamicTexture, StackPanel, TextBlock } from "@babylonjs/gui";
import { Nullable, Scene } from "@babylonjs/core";
import { GameSession } from "./GameSession";
import { GameState } from "./GameState";
import { Parameters } from "../Parameters";

export class State {
    static currentState: Nullable<State> = null;
    protected _adt: Nullable<AdvancedDynamicTexture> = null;
    public static setCurrent(newState: State): void {
        if (this.currentState === newState) {
            return;
        }
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = newState;
        if (this.currentState) {
            this.currentState.enter();
        }
    }

    public exit() {
        if (this._adt) {
            this._adt.dispose();
        }
    }

    public enter() {
        const scene = GameState.gameSession?.getScene();
        this._adt = AdvancedDynamicTexture.CreateFullscreenUI("Main", true, scene);
        this._adt.layer!.layerMask = 0x10000000;
    }

    // helpers
    protected _addText(text: string, panel: StackPanel): void {
        var textBlock = new TextBlock();
        textBlock.text = text.toUpperCase();
        textBlock.width = 0.6;
        textBlock.height = "20px";
        textBlock.color = "white";
        Parameters.setFont(textBlock, true);
        panel.addControl(textBlock);
    }
}