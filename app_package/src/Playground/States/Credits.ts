import { Button, StackPanel, TextBlock } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";

export class Credits extends State {

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
        textBlock.text = "Lorem ipsum dolor sit amet ...";
        textBlock.width = 0.6;
        textBlock.height = "500px";
        textBlock.color = "white";
        panel.addControl(textBlock);

        var button = Button.CreateSimpleButton("but", "Back");
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        panel.addControl(button);

        button.onPointerDownObservable.add(function(info) {
            State.setCurrent(States.main);
        });

        this._adt.addControl(panel);
    }
}