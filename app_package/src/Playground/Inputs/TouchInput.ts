import { Nullable, Observable } from "@babylonjs/core";
import {
    AdvancedDynamicTexture,
    Button,
    Container,
    Control,
    Ellipse,
    TextBlock,
    Vector2WithInfo,
} from "@babylonjs/gui";
import { Input, InputManager } from './Input';
import { ShipManager } from "../Ship";
import { Parameters } from "../Parameters";
import { Settings } from "../../Settings";

function makeThumbArea(
    name: string,
    thickness: number,
    color: string,
    background: Nullable<string>
) {
    const rect = new Ellipse();
    rect.name = name;
    rect.thickness = thickness;
    rect.color = color;
    if (background) rect.background = background as string;
    rect.paddingLeft = "0px";
    rect.paddingRight = "0px";
    rect.paddingTop = "0px";
    rect.paddingBottom = "0px";
    return rect;
}

class TouchButton {
    container: Container;
    text: TextBlock;
    circle: Ellipse;
    onPointerDownObservable: Observable<Vector2WithInfo>;
    onPointerUpObservable: Observable<Vector2WithInfo>;
    constructor(name: string, text: string, adt: AdvancedDynamicTexture) {
        this.container = new Container(name);
        this.container.isPointerBlocker = true;
        this.text = new TextBlock(`${name}Text`, text);
        this.container.addControl(this.text);
        this.text.color = 'white';
        this.circle = new Ellipse(`${name}Circle`);
        this.container.addControl(this.circle);
        this.circle.width = 0.8;
        this.circle.height = 0.8;
        this.circle.color = 'white';
        this.container.left = -10;
        this.container.top = -10;
        this.container.verticalAlignment = Button.VERTICAL_ALIGNMENT_BOTTOM;
        this.container.horizontalAlignment = Button.HORIZONTAL_ALIGNMENT_RIGHT;
        this.container.background = "transparent";
        this.container.color = "white";
        this.onPointerDownObservable = this.container.onPointerDownObservable;
        this.onPointerUpObservable = this.container.onPointerUpObservable;
        this.onPointerDownObservable.add(() => this.circle.width = this.circle.height = 0.7);
        this.onPointerUpObservable.add(() => this.circle.width = this.circle.height = 0.8);
        adt.addControl(this.container);
    }
    public set color(color: string) {
        this.text.color = color;
        this.circle.color = color;
    }
    public get color(): string {
        return this.text.color;
    }
    public setSize(size: number) {
        this.container.widthInPixels = this.container.heightInPixels = size;
    }
}

export class TouchInput {
    _adt: AdvancedDynamicTexture;
    _shipManager: ShipManager;
    _fireButton: TouchButton;
    _missileButton: TouchButton;
    _burstButton: TouchButton;
    _brakeButton: TouchButton;
    _flipButton: TouchButton;
    _leftThumbContainer: Ellipse;
    _leftInnerThumbContainer: Ellipse;
    _leftPuck: Ellipse;
    _xAddPos = 0;
    _yAddPos = 0;
    constructor(adt: AdvancedDynamicTexture, shipManager: ShipManager) {
        this._adt = adt;
        this._shipManager = shipManager;
        this._xAddPos = 0;
        let sideJoystickOffset = 10;
        let bottomJoystickOffset = -10;
        this._leftThumbContainer = makeThumbArea("this._leftThumb", 2, "blue", null);
        this._leftThumbContainer.isPointerBlocker = true;
        this._leftThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._leftThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._leftThumbContainer.alpha = 0.4;
        this._leftThumbContainer.left = sideJoystickOffset;
        this._leftThumbContainer.top = bottomJoystickOffset;

        this._leftInnerThumbContainer = makeThumbArea(
            "leftInnerThumb",
            4,
            "blue",
            null
        );
        this._leftInnerThumbContainer.height = 0.4;
        this._leftInnerThumbContainer.width = 0.4;
        this._leftInnerThumbContainer.isPointerBlocker = true;
        this._leftInnerThumbContainer.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._leftInnerThumbContainer.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_CENTER;

        this._leftPuck = makeThumbArea("this._leftPuck", 0, "blue", "blue");
        this._leftPuck.height = 0.4;
        this._leftPuck.width = 0.4;
        this._leftPuck.isPointerBlocker = true;
        this._leftPuck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._leftPuck.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const _this = this;

        let leftPuckFloatLeft,
            leftPuckFloatTop,
            leftPuckIsDown = false;

        this._leftThumbContainer.onPointerDownObservable.add(function (coordinates) {
            _this._leftPuck.isVisible = true;
            leftPuckFloatLeft =
                coordinates.x -
                _this._leftThumbContainer._currentMeasure.width * 0.5 -
                sideJoystickOffset;
            _this._leftPuck.left = leftPuckFloatLeft;
            leftPuckFloatTop =
                (adt as any)._canvas.height -
                coordinates.y -
                _this._leftThumbContainer._currentMeasure.height * 0.5 +
                bottomJoystickOffset;
                _this._leftPuck.top = leftPuckFloatTop * -1;
            leftPuckIsDown = true;
            _this._leftThumbContainer.alpha = 0.9;
        });

        this._leftThumbContainer.onPointerUpObservable.add(function (coordinates) {
            _this._xAddPos = 0;
            _this._yAddPos = 0;
            leftPuckIsDown = false;
            _this._leftPuck.isVisible = false;
            _this._leftThumbContainer.alpha = 0.4;
        });

        this._leftThumbContainer.onPointerMoveObservable.add(function (coordinates) {
            if (leftPuckIsDown) {
                _this._xAddPos =
                    coordinates.x -
                    _this._leftThumbContainer._currentMeasure.width * 0.5 -
                    sideJoystickOffset;
                    _this._yAddPos =
                    (adt as any)._canvas.height -
                    coordinates.y -
                    _this._leftThumbContainer._currentMeasure.height * 0.5 +
                    bottomJoystickOffset;
                leftPuckFloatLeft = _this._xAddPos;
                leftPuckFloatTop = _this._yAddPos * -1;
                _this._leftPuck.left = leftPuckFloatLeft;
                _this._leftPuck.top = leftPuckFloatTop;
            }
        });

        adt.addControl(this._leftThumbContainer);
        this._leftThumbContainer.addControl(this._leftInnerThumbContainer);
        this._leftThumbContainer.addControl(this._leftPuck);
        this._leftPuck.isVisible = false;


        this._fireButton = new TouchButton("fireButton", "FIRE", adt);
        this._fireButton.color = "orange";
        this._fireButton.onPointerDownObservable.add(() => {
            InputManager.input.shooting = true;
            this._fireButton.color = "white";
        });
        this._fireButton.onPointerUpObservable.add(() => {
            InputManager.input.shooting = false;
            this._fireButton.color = "orange";
        });

        this._missileButton = new TouchButton("missileButton", "MISSILE", adt);
        this._missileButton.color = "grey";
        this._missileButton.onPointerDownObservable.add(() => {
            InputManager.input.launchMissile = true;
            this._missileButton.color = "white";
        });
        this._missileButton.onPointerUpObservable.add(() => {
            InputManager.input.launchMissile = false;
        });

        this._burstButton = new TouchButton("burstButton", "BURST", adt);
        this._burstButton.color = "blue";
        this._burstButton.onPointerDownObservable.add(() => {
            InputManager.input.burst = true;
        })
        this._burstButton.onPointerUpObservable.add(() => {
            InputManager.input.burst = false;
        })

        this._brakeButton = new TouchButton("brakeButton", "BRAKE", adt);
        this._brakeButton.color = "yellow";
        this._brakeButton.container.horizontalAlignment = Button.HORIZONTAL_ALIGNMENT_LEFT;
        this._brakeButton.container.leftInPixels = 10;
        this._brakeButton.onPointerDownObservable.add(() => {
            InputManager.input.breaking = true;
        })
        this._brakeButton.onPointerUpObservable.add(() => {
            InputManager.input.breaking = false;
        })

        this._flipButton = new TouchButton("flipButton", "FLIP", adt);
        this._flipButton.color = "pink";
        this._flipButton.container.horizontalAlignment = Button.HORIZONTAL_ALIGNMENT_LEFT;
        this._flipButton.container.leftInPixels = 10;
        this._flipButton.onPointerDownObservable.add(() => {
            InputManager.input.immelmann = true;
        })
        this._flipButton.onPointerUpObservable.add(() => {
            InputManager.input.immelmann = false;
        })
    }

    public tick() {
        const thirdOfScreen = Math.min((this._adt.getSize().width - 20) * 0.3, (this._adt.getSize().height - 20) * 0.3);
        this._leftThumbContainer.widthInPixels = this._leftThumbContainer.heightInPixels = thirdOfScreen;
        this._fireButton.setSize(thirdOfScreen);
        this._fireButton.container.heightInPixels = this._fireButton.container.widthInPixels = thirdOfScreen;
        this._missileButton.setSize(thirdOfScreen);
        this._missileButton.container.topInPixels = -30 - thirdOfScreen * 2;
        this._burstButton.setSize(thirdOfScreen);
        this._burstButton.container.topInPixels = -20 - thirdOfScreen;
        this._brakeButton.setSize(thirdOfScreen);
        this._brakeButton.container.topInPixels = -20 - thirdOfScreen;
        this._flipButton.setSize(thirdOfScreen);
        this._flipButton.container.topInPixels = -30 - thirdOfScreen * 2;
        

        InputManager.input.dx = this._xAddPos / 3000;
        InputManager.input.dy = (this._yAddPos / 3000) * -1;
        if (Settings.invertY) {
            InputManager.input.dy *= -1;
        }
        InputManager.input.constrainInput();
        const player = this._shipManager.ships[0];
        if (
            player.missileCooldown <= 0 &&
            player.bestPreyTime >= Parameters.timeToLockMissile &&
            player.bestPrey >= 0
        ) {
            this._missileButton.color = "red";
        } else {
            this._missileButton.color = "grey";
        }
    }
}
