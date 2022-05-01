import { Engine } from "@babylonjs/core";
import { Control, Button, Grid, StackPanel, Image, CornerHandle, AdvancedDynamicTexture } from "@babylonjs/gui";

export class GuiFramework {
    public static guiFont = {
        family: "magistral, sans-serif",
        book: "300",
        bold: "700",
        style: "normal"
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
        grid.addRowDefinition(170, true);
        grid.addRowDefinition(1.0, false);
        grid.addRowDefinition(220, true);
        grid.addColumnDefinition(380, true);
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
    }

    public static setFont(element: any, isBold: boolean) {
        element.fontFamily = GuiFramework.guiFont.family;
        if (isBold) {
            element.fontWeight = GuiFramework.guiFont.bold;
        } else {
            element.fontWeight = GuiFramework.guiFont.book;
        }
        element.fontStyle = GuiFramework.guiFont.style;
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
        console.log(image);
        button.fontSize = "26px";
        button.width = "400px";
        button.height = "100px";
        button.color = "#a6fffa";
        button.thickness = 0;
        GuiFramework.setFont(button, true);
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
        grid.addColumnDefinition(0.3, false)
        grid.addColumnDefinition(0.7, false)
        grid.width = 0.914;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    }
}