import { Nullable } from "@babylonjs/core";
import { Button, Checkbox, Slider, StackPanel, TextBlock } from "@babylonjs/gui";
import { InputManager } from "../Inputs/Input";
import { State } from "./State";
import { Parameters } from '../Parameters';
import { Settings } from "../../Settings";

export class Options extends State {

    public backDestination: Nullable<State> = null;

    public exit() {
        super.exit();
    }

    private makeLabel(panel: StackPanel) {
        const label = new TextBlock();
        label.width = 0.6;
        label.height = "20px";
        label.color = "white";
        label.topInPixels = 20;
        panel.addControl(label);
        return label;
    }

    private makeSlider(panel: StackPanel, name: string, labelFunction: () => string, updateFunction: (value: number) => void, initialValue: number) {
        const label = this.makeLabel(panel);
        const updateLabel = () => {
            label.text = labelFunction();
        }
        updateLabel();

        const slider = new Slider("volume");

        slider.step = 0.05;
        slider.value = initialValue;
        slider.onValueChangedObservable.add(() => {
            updateFunction(slider.value);
            updateLabel();
        });
        slider.heightInPixels = 40;
        slider.paddingBottomInPixels = 20;
        slider.widthInPixels = 300;
        slider.color = "black";
        slider.thumbColor = "white";
        panel.addControl(slider);
        return slider;
    }

    public enter() {
        super.enter();
        if (!this._adt) {
            return;
        }
        InputManager.disablePointerLock();
        
        var panel = new StackPanel();

        var textBlock = new TextBlock();
        textBlock.text = "Options";
        textBlock.width = 0.6;
        textBlock.height = "100px";
        textBlock.color = "white";
        panel.addControl(textBlock);

        const volume = this.makeSlider(panel,"volume", () => `Volume: ${Math.floor(Settings.volume * 100)}%`, (value) => Settings.volume = value, Settings.volume);
        volume.minimum = 0;
        volume.maximum = 1;
        const sensitivity = this.makeSlider(panel, "sensitivty", () => `Sensitivity: ${Math.floor(Settings.sensitivity * 100)}%`, (value) => Settings.sensitivity = value, Settings.sensitivity)
        sensitivity.minimum = 0.05;
        sensitivity.maximum = 2;

        const showParametersLabel = this.makeLabel(panel);
        showParametersLabel.text = "Show Parameters";
        const showParameters = new Checkbox("parameters");
        showParameters.widthInPixels = 20;
        showParameters.heightInPixels = 20;
        showParameters.isChecked = Settings.showParameters;
        showParameters.onIsCheckedChangedObservable.add((checked) => {
            Settings.showParameters = checked;
        })
        showParameters.color = "white";
        panel.addControl(showParameters);

        const invertYLabel = this.makeLabel(panel);
        invertYLabel.text = "Invert Y";
        const invertY = new Checkbox("invertY");
        invertY.isChecked = Settings.invertY;
        invertY.onIsCheckedChangedObservable.add((checked) => {
            Settings.invertY = checked;
        })
        invertY.widthInPixels = 20;
        invertY.heightInPixels = 20;
        invertY.color = 'white';
        panel.addControl(invertY);

        var button = Button.CreateSimpleButton("but", "Back");
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        panel.addControl(button);

        var _this = this;
        button.onPointerDownObservable.add(function(info) {
            if (_this.backDestination) {
                State.setCurrent(_this.backDestination);
            }
        });

        this._adt.addControl(panel);
    }
}