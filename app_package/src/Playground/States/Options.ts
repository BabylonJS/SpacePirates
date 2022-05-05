import { Nullable } from "@babylonjs/core";
import { Control, Grid, Checkbox, Slider, StackPanel, TextBlock } from "@babylonjs/gui";
import { InputManager } from "../Inputs/Input";
import { State } from "./State";
import { States } from "./States";
import { Parameters } from '../Parameters';
import { Settings } from "../../Settings";
import { GuiFramework } from "../GuiFramework";

export class Options extends State {

    public backDestination: Nullable<State> = null;

    public exit() {
        super.exit();
    }

    public enter() {
        super.enter();
        if (!this._adt) {
            return;
        }
        InputManager.disablePointerLock();

        if (GuiFramework.isLandscape) {
            GuiFramework.createBottomBar(this._adt);
            const panel = new StackPanel();
            const parametersPanel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            const grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);
            grid.addControl(parametersPanel, 0, 1);
            const panelGrid: Grid = GuiFramework.createTextPanel(grid);
            GuiFramework.createPageTitle("Options", panelGrid);
    
            const parametersGrid = GuiFramework.createParametersGrid();
            grid.addControl(parametersGrid, 0, 1);
            const volumeSlider: Control = GuiFramework.createParameter(parametersGrid, "Volume", GuiFramework.createSlider(0, 1.0), Settings.volume);
            (volumeSlider as Slider).onValueChangedObservable.add((newValue) => {
                Settings.volume = newValue;
            });
            const sensitivitySlider: Control = GuiFramework.createParameter(parametersGrid, "Sensitivity", GuiFramework.createSlider(0.05, 2.0), Settings.sensitivity);
            (sensitivitySlider as Slider).onValueChangedObservable.add((newValue) => {
                Settings.sensitivity = newValue;
            });
            const showParameters: Control = GuiFramework.createParameter(parametersGrid, "Show Parameters", GuiFramework.createCheckbox(), Number(Settings.showParameters));
            (showParameters as Checkbox).onIsCheckedChangedObservable.add((checked) => {
                Settings.showParameters = checked;
            });
            const invertY: Control = GuiFramework.createParameter(parametersGrid, "Invert Y", GuiFramework.createCheckbox(), Number(Settings.invertY));
            (invertY as Checkbox).onIsCheckedChangedObservable.add((checked) => {
                Settings.invertY = checked;
            });
    
            var _this = this;
            GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function(info) {
                if (_this.backDestination) {
                    State.setCurrent(_this.backDestination);
                }
            });
            this._adt.addControl(grid);

        } else {
            const panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            panel.paddingBottom = "100px";
            const grid = new Grid();
            grid.addRowDefinition (0.2, false);
            grid.addRowDefinition (0.6, false);
            grid.addRowDefinition (0.2, false);
            grid.addControl(panel, 2, 0);
            
            let textBlock = new TextBlock("", "OPTIONS");
            GuiFramework.setFont(textBlock, true, true);
            textBlock.fontSize = 35;
            textBlock.color = "#a6fffa";
            textBlock.horizontalAlignment =  Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(textBlock, 0, 0);
    
            const parametersGrid = GuiFramework.createParametersGrid();
            grid.addControl(parametersGrid, 1,0);
            const volumeSlider: Control = GuiFramework.createParameter(parametersGrid, "Volume", GuiFramework.createSlider(0, 1.0), Settings.volume);
            (volumeSlider as Slider).onValueChangedObservable.add((newValue) => {
                Settings.volume = newValue;
            });
            const sensitivitySlider: Control = GuiFramework.createParameter(parametersGrid, "Sensitivity", GuiFramework.createSlider(0.05, 2.0), Settings.sensitivity);
            (sensitivitySlider as Slider).onValueChangedObservable.add((newValue) => {
                Settings.sensitivity = newValue;
            });
            const showParameters: Control = GuiFramework.createParameter(parametersGrid, "Show Parameters", GuiFramework.createCheckbox(), Number(Settings.showParameters));
            (showParameters as Checkbox).onIsCheckedChangedObservable.add((checked) => {
                Settings.showParameters = checked;
            });
            const invertY: Control = GuiFramework.createParameter(parametersGrid, "Invert Y", GuiFramework.createCheckbox(), Number(Settings.invertY));
            (invertY as Checkbox).onIsCheckedChangedObservable.add((checked) => {
                Settings.invertY = checked;
            });
            parametersGrid.width = 0.8;
            parametersGrid.setColumnDefinition(0, 0.4, false);
            parametersGrid.setColumnDefinition(1, 0.6, false);
    
            var _this = this;
            GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function(info) {
                if (_this.backDestination) {
                    State.setCurrent(_this.backDestination);
                }
            });
            this._adt.addControl(grid);
        }
    }
}