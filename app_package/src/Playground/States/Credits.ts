import { Control, Grid, StackPanel, TextBlock, Image } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GuiFramework } from "../GuiFramework";

export class Credits extends State {

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
        textBlock.shadowOffsetX = 2;
        textBlock.shadowOffsetY = 2;
        textBlock.shadowColor = "black";
        textBlock.shadowBlur = 0;
        textBlock.width = 0.5;
        textBlock.height = 1.0;
        textBlock.color = "white";
        GuiFramework.setFont(textBlock, false);
        grid.addControl(textBlock, 0, 1);

        GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function(info) {
            State.setCurrent(States.main);
        });

        this._adt.addControl(grid);
    }
}