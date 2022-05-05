import { Engine, Vector2 } from "@babylonjs/core";
import { Control, Button, Grid, StackPanel, Image, CornerHandle, AdvancedDynamicTexture, TextBlock, Rectangle, Slider, Checkbox, RadioButton } from "@babylonjs/gui";

export class GuiFramework {
    public static guiFont = {
        family: "magistral, sans-serif",
        book: "300",
        bold: "700",
        style: "normal"
    }

    public static isLandscape : boolean;
    public static screenWidth : number;
    public static screenHeight : number;
    public static screenRatio : number;
    public static ratioBreakPoint : number = 1.4;
    public static currentAdt : AdvancedDynamicTexture;

    public static updateGuiBasedOnOrientation(adt: AdvancedDynamicTexture) {
        let controls: any = adt.getDescendants(false);
        if (this.isLandscape === false) {
            for (let index in controls) {
                controls[index].alpha = 0
                controls[index].isEnabled = false;
            }
            let warning = adt.getControlByName("portraitWarning");
            if (warning) warning.alpha = 1.0;
        } else {
            for (let index in controls) {
                controls[index].alpha = 1
                controls[index].isEnabled = true;
            }
            let warning = adt.getControlByName("portraitWarning");
            if (warning) warning.alpha = 0.0;
        }
    }

    public static setOrientation(adt?: AdvancedDynamicTexture) {
        if (adt !== undefined) this.currentAdt = adt;
        this.isLandscape = (this.screenRatio > 1.4) ? true : false;
        if (this.currentAdt !== undefined) this.updateGuiBasedOnOrientation(this.currentAdt);
    };

    public static updateScreenRatio(engine: Engine) {
        this.screenWidth = engine.getRenderWidth(true);
        this.screenHeight = engine.getRenderHeight(true);
        this.screenRatio = this.screenWidth/this.screenHeight;
        this.setOrientation()
    }

    public static createBottomBar(adt: AdvancedDynamicTexture) {
        let bottomBarLeft: Image = new Image("bottomBarLeft", "/assets/UI/bottomBarLeft.svg");
        let bottomBarCenter: Image = new Image("bottomBarCenter", "/assets/UI/bottomBarCenter.svg");
        let bottomBarRight: Image = new Image("bottomBarRight", "/assets/UI/bottomBarRight.svg");
        let grid: Grid = new Grid();
        grid.addRowDefinition(270, true);
        grid.addColumnDefinition(645, true);
        grid.addColumnDefinition(1.0, false);
        grid.addColumnDefinition(790, true);
        grid.width = 0.914;
        grid.heightInPixels = 270;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        grid.addControl(bottomBarLeft, 0, 0);
        grid.addControl(bottomBarCenter, 0, 1);
        grid.addControl(bottomBarRight, 0, 2);
        adt.addControl(grid);  
        
        // add in portrait warning... to do add portrait mode UI
        // let portraitWarning = new TextBlock ("portraitWarning", "Please play this game in landscape mode".toUpperCase());
        // this.setFont(portraitWarning, true, true);
        // portraitWarning.fontSize = "40px";
        // portraitWarning.color = "white";
        // portraitWarning.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        // portraitWarning.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        // portraitWarning.width = 1.0;
        // portraitWarning.height = 1.0;
        // portraitWarning.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        // portraitWarning.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        // portraitWarning.alpha = 0;
        // adt.addControl(portraitWarning);
    }

    public static createTextPanel(parentGrid: Grid) {
        let textPanelUL: Image = new Image("bottomBarLeft", "/assets/UI/textPanelUL.svg");
        let textPanelUC: Image = new Image("bottomBarCenter", "/assets/UI/textPanelUC.svg");
        let textPanelUR: Image = new Image("bottomBarRight", "/assets/UI/textPanelUR.svg");
        let textPanelCL: Image = new Image("bottomBarLeft", "/assets/UI/textPanelCL.svg");
        let textPanelCC: Image = new Image("bottomBarCenter", "/assets/UI/textPanelCC.svg");
        let textPanelCR: Image = new Image("bottomBarRight", "/assets/UI/textPanelCR.svg");
        let textPanelLL: Image = new Image("bottomBarLeft", "/assets/UI/textPanelLL.svg");
        let textPanelLC: Image = new Image("bottomBarCenter", "/assets/UI/textPanelLC.svg");
        let textPanelLR: Image = new Image("bottomBarRight", "/assets/UI/textPanelLR.svg");
        let grid: Grid = new Grid();
        grid.clipChildren = false;
        grid.addRowDefinition(170, true);
        grid.addRowDefinition(1.0, false);
        grid.addRowDefinition(220, true);
        grid.addColumnDefinition(340, true);
        grid.addColumnDefinition(1.0, false);
        grid.addColumnDefinition(440, true);
        grid.topInPixels = 50;
        grid.width = 0.9;
        grid.height = 0.8;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        grid.addControl(textPanelUL, 0, 0);
        grid.addControl(textPanelUC, 0, 1);
        grid.addControl(textPanelUR, 0, 2);
        grid.addControl(textPanelCL, 1, 0);
        grid.addControl(textPanelCC, 1, 1);
        grid.addControl(textPanelCR, 1, 2);
        grid.addControl(textPanelLL, 2, 0);
        grid.addControl(textPanelLC, 2, 1);
        grid.addControl(textPanelLR, 2, 2);
        parentGrid.addControl(grid, 0, 1);
        return grid;
    }

    public static createPageTitle(title: string, grid: Grid) {
        let textBlock = new TextBlock("panelTitle", title.toUpperCase());
        this.setFont(textBlock, true, true);
        textBlock.fontSize = 35;
        textBlock.color = "#a6fffa";
        textBlock.horizontalAlignment =  Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.topInPixels = 5;
        grid.addControl(textBlock, 0, 1);
    }

    public static debugCell(grid: Grid, cell: Vector2) {
        let rect = new Rectangle();
        rect.background = "red";
        rect.color = "orange";
        rect.thickness = 3;
        rect.width = 1.0;
        rect.height = 1.0;
        rect.alpha = 0.3;
        grid.addControl(rect, cell.x, cell.y);
    }

    public static createRadioButton(checked?: boolean) {
        let radio = new RadioButton();
        radio.color = "#ffffff";
        radio.background = "#688899";
        radio.thickness = 2;
        radio.shadowOffsetX = 2;
        radio.shadowOffsetY = 2;
        radio.shadowColor = "black";
        radio.height = 0.4;
        radio.checkSizeRatio = 0.5;
        radio.fixedRatio = 1.0;
        radio.leftInPixels = 20;
        radio.isChecked = (checked) ? checked : false;
        return radio;
    }

    public static createCheckbox() {
        let checkbox = new Checkbox();
        checkbox.color = "#ffffff"
        checkbox.background = "#688899"
        checkbox.thickness = 2;
        checkbox.shadowOffsetX = 2;
        checkbox.shadowOffsetY = 2;
        checkbox.shadowColor = "black";
        checkbox.height = 0.4;
        checkbox.fixedRatio = 1.0;
        checkbox.checkSizeRatio = 0.5;
        checkbox.leftInPixels = 20;
        return checkbox;
    }

    public static createSlider(min: number, max: number, startValue?: number) {
        let slider = new Slider();
        slider.minimum = min;
        slider.maximum = max;
        slider.height = 0.35;
        slider.color = "#269ad4";
        slider.background = "#688899"
        slider.thumbColor = "#a6fffa";
        slider.shadowOffsetX = 2;
        slider.shadowOffsetY = 2;
        slider.shadowColor = "black";
        slider.isThumbCircle = true;
        slider.value = (startValue) ? startValue : min;
        return slider;
    }

    public static createStatText(string: string) {
        let textBlock = new TextBlock("", string);
        this.setFont(textBlock, true, true);
        textBlock.color = "#a6fffa";
        textBlock.fontSize = 24;
        textBlock.leftInPixels = 20;
        textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        return textBlock;
    }

    public static createSplashText(string: string) {
        let textBlock = new TextBlock("", string.toUpperCase());
        this.setFont(textBlock, true, true);
        textBlock.color = "#a6fffa";
        textBlock.fontSize = 30;
        textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        return textBlock;
    }

    public static createScreenshotText(grid: Grid, cell: Vector2, string: string, leftAlign?: boolean) {
        let textBlock = new TextBlock("", string.toUpperCase());
        this.setFont(textBlock, true, true);
        textBlock.color = "white";
        textBlock.fontSize = 16;
        textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        if (leftAlign) {
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        } else {
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        }
        grid.addControl(textBlock, cell.x, cell.y);
        return textBlock;
    }

    public static createScreenshotGrid() {
        let grid = new Grid();
        for (let i = 0; i < 9; i++) {
            grid.addRowDefinition(0.1, false);
        }
        grid.addColumnDefinition(0.4, false);
        grid.addColumnDefinition(0.6, false);
        grid.height = 0.4;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        return grid;
    }

    public static createRecapGrid() {
        let grid = new Grid();
        grid.addRowDefinition(0.1, false);
        grid.addRowDefinition(0.9, false);
        grid.addColumnDefinition(1.0, false);
        grid.topInPixels = 250;
        grid.height = 0.6;
        grid.width = 0.9;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        return grid;
    }

    public static createStatsGrid() {
        let grid: Grid = new Grid();
        grid.addColumnDefinition(0.5, false);
        grid.addColumnDefinition(0.5, false);    
        grid.width = 1.0;
        grid.topInPixels = 0;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        return grid;
    }

    public static createParametersGrid() {
        let grid: Grid = new Grid();
        grid.addColumnDefinition(0.4, false);
        grid.addColumnDefinition(0.6, false);    
        grid.width = 0.6;
        grid.topInPixels = -100;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        return grid;
    }

    public static createParameter(grid: Grid, label: string, controlType: Control, currentValue?: number) {
        let rowHeight = 60;
        grid.addRowDefinition(rowHeight, true);
        let totalRows: number = grid.rowCount;
        grid.heightInPixels = totalRows * rowHeight;
        let parameterLabel = new TextBlock("", label.toUpperCase());
        this.setFont(parameterLabel, true, true);
        parameterLabel.color = "white";
        parameterLabel.fontSize = 24;
        parameterLabel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        parameterLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        controlType.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        if (controlType.typeName === "Checkbox") {
            let checkbox = controlType as Checkbox;
            if (currentValue) checkbox.isChecked = Boolean(currentValue.valueOf());
            grid.addControl(checkbox, totalRows - 1, 1);
        }
        if (controlType.typeName === "Slider") {
            let sliderGrid = new Grid();
            sliderGrid.addRowDefinition(1.0, false);
            sliderGrid.addColumnDefinition(0.1, false);
            sliderGrid.addColumnDefinition(0.9, false);
            let sliderValue = new TextBlock()
            this.setFont(sliderValue, true, true);
            sliderValue.color = "white";
            sliderValue.fontSize = 24;
    
            let slider = controlType as Slider;
            slider.onValueChangedObservable.add(() => {
                sliderValue.text = Math.floor(slider.value * 100) as unknown as string;
            });
            sliderGrid.addControl(sliderValue, 0, 0);
            sliderGrid.addControl(slider, 0, 1);
            grid.addControl(sliderGrid, totalRows - 1, 1);
            if (currentValue) slider.value = currentValue;
        }

        if (controlType.typeName === "TextBlock") {
            grid.addControl(controlType, totalRows - 1, 1);
        }
        grid.addControl(parameterLabel, totalRows - 1, 0);
        return controlType;
    }

    public static setFont(element: any, isBold: boolean, hasShadow: boolean) {
        element.fontFamily = this.guiFont.family;
        if (isBold) {
            element.fontWeight = this.guiFont.bold;
        } else {
            element.fontWeight = this.guiFont.book;
        }
        if (hasShadow) {
            element.shadowOffsetX = 2;
            element.shadowOffsetY = 2;
            element.shadowColor = "black";
        }
        element.fontStyle = this.guiFont.style;
    }

    public static addButton(label: string, panel: StackPanel): Button {
        var button = Button.CreateImageButton("button", label.toUpperCase(), "/assets/UI/menuButton.svg");
        let image: any = button.image;
        image.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        image.width = "400px";
        image.height = "200px";
        image.topInPixels = 0;
        let text: any = button.textBlock;
        text.width = "400px";
        text.zIndex = 10;
        text.topInPixels = -5;
        text.paddingRightInPixels = 50;
        text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        text.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        button.fontSize = "26px";
        button.width = "400px";
        button.height = "100px";
        button.color = "#a6fffa";
        button.thickness = 0;
        if (this.isLandscape) {
            button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        } else {
            button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        }
        this.setFont(button, true, false);
        button.onPointerEnterObservable.add(() => {
            image.topInPixels = -100;
            button.color = "#ffffff";
        });
        button.onPointerOutObservable.add(() => {
            image.topInPixels = 0;
            button.color = "#a6fffa";
        });
        panel.addControl(button);
        return button;
    }

    public static formatButtonGrid(grid: Grid) {
        grid.addRowDefinition(1.0, false);
        grid.addRowDefinition(140, true);
        grid.addColumnDefinition(0.23, false)
        grid.addColumnDefinition(0.77, false)
        grid.width = 0.914;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    }
}