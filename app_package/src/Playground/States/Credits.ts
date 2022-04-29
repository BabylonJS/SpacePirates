import { Control, Button, StackPanel, TextBlock } from "@babylonjs/gui";
import { Parameters } from "../Parameters";
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
        textBlock.text = "This demo was made by some members of the Babylon.js core team, @PatrickCRyan, @skaven_, and @DarraghBurke_, " + 
        "to celebrate the release of Babylon.js 5.0.\n\n" + 
        "The mission of our Babylon.js team is to create one of the most powerful, beautiful, " + 
        "and simple web rendering engines in the world. Our passion is to make it completely open and free for everyone. As you may have guessed, " + 
        "Babylon.js was named with a deep love and admiration of one of the greatest sci-fi shows of all time.\n\n" + 
        "To get  the code of this demo on: https://github.com/BabylonJS/SpacePirates \n" + 
        "To learn about Babylon.js: https://doc.babylonjs.com \n" + 
        "To connect with the community: https://forum.babylonjs.com";
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.width = 0.6;
        textBlock.height = "500px";
        textBlock.color = "white";
        Parameters.setFont(textBlock, false);
        panel.addControl(textBlock);

        var button = Button.CreateSimpleButton("but", "Back");
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        Parameters.setFont(button, true);
        panel.addControl(button);

        button.onPointerDownObservable.add(function(info) {
            State.setCurrent(States.main);
        });

        this._adt.addControl(panel);
    }
}