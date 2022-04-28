import { AdvancedDynamicTexture, Control, StackPanel, TextBlock, Slider, Image, InputText, Checkbox, Button } from "@babylonjs/gui";
import { Vector3, Vector4, Engine, Camera, Nullable, Scene, Color3 } from "@babylonjs/core";
import { ShipManager, Ship } from './Ship';
import { Parameters } from './Parameters';
import { InputManager } from './Inputs/Input';
import { TouchInput } from "./Inputs/TouchInput";
import { Settings } from "../Settings";
import { GamepadInput } from "./Inputs/GamepadInput";
import { Assets } from "./Assets";

class HUDPanel {
    private _bars: StackPanel;
    private _missile: Slider
    private _speed: Slider
    private _health: Slider;
    private _targets = new Array<Image>();
    private _targetLock: Image;
    private _divisor: number;
    private _index: number;
    private _fpsCounter: TextBlock;
    constructor(assets: Assets, adt: AdvancedDynamicTexture, divisor: number, index: number) {
        this._divisor = divisor;
        this._index = index;

        this._fpsCounter = new TextBlock();
        this._fpsCounter.text= "00000000";
        this._fpsCounter.width = 0.2;
        this._fpsCounter.height = "40px";
        this._fpsCounter.color = "white";
        this._fpsCounter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._fpsCounter.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._fpsCounter.top = "0px";
        this._fpsCounter.left = "0px";
        adt.addControl(this._fpsCounter);

        for(let i = 0; i < 20; i++) {
            var image = new Image("img", assets.assetsHostUrl+"/assets/UI/trackerIcon.svg");
            image.height = "32px";
            image.width = "32px";
            image.isVisible = false;
            adt.addControl(image);
            this._targets.push(image);
            image.alpha = 0.4;
        }

        this._targetLock = new Image("img", assets.assetsHostUrl+"/assets/UI/missileLockIcon.svg");
        this._targetLock.height = "128px";
        this._targetLock.width = "128px";
        this._targetLock.sourceWidth = 256;
        this._targetLock.sourceLeft = 0;
        this._targetLock.isVisible = false;
        adt.addControl(this._targetLock);

        this._bars = new StackPanel("bars");
        this._bars.paddingBottomInPixels = 20;
        if (index) {
            this._bars.leftInPixels = 20;
            this._bars.horizontalAlignment = StackPanel.HORIZONTAL_ALIGNMENT_RIGHT;
        } else {
            this._bars.leftInPixels = 20;
            this._bars.horizontalAlignment = StackPanel.HORIZONTAL_ALIGNMENT_LEFT;
        }
        this._bars.verticalAlignment = StackPanel.VERTICAL_ALIGNMENT_BOTTOM;
        this._bars.width = 0.2;
        adt.addControl(this._bars);

        this._health = new Slider("health");
        this._health.color = "red";
        this._health.heightInPixels = 20;
        this._health.width = 1;
        this._health.displayThumb = false;
        this._health.minimum = 0;
        this._health.maximum = 100;
        this._bars.addControl(this._health);

        this._missile = new Slider("MissileLoading");
        this._missile.color = "white";
        this._missile.heightInPixels = 20;
        this._missile.width = 1;
        this._missile.displayThumb = false;
        this._missile.minimum = 0;
        this._missile.maximum = Parameters.missileCoolDownTime;
        this._bars.addControl(this._missile);

        this._speed = new Slider("Speed");
        this._speed.color = "orange";
        this._speed.heightInPixels = 20;
        this._speed.width = 1;
        this._speed.displayThumb = false;
        this._speed.minimum = 0;
        this._speed.maximum = 1;
        this._bars.addControl(this._speed);
    }

    public tick(engine: Engine, player: Ship, shipManager: ShipManager): void {
        // hide every image
        this._targets.forEach(image => {
            image.isVisible = false;
        });

        let targetIndex = 0;
        shipManager.ships.forEach((ship) => {
            if (ship.isValid() && ship != player && ship.faction != player.faction) {
                this._computeScreenCoord(engine, player.shipCamera!.getFreeCamera(), ship.root.position, this._targets[targetIndex]);
                targetIndex++;
            }
        });

        this._missile.value = player.missileCooldown;
        this._speed.value = player.speedRatio;
        this._health.value = player.life;

        if (player.bestPrey > 0 && shipManager.ships[player.bestPrey] && player.shipCamera) {
            const interpolate = Math.min(player.bestPreyTime / Parameters.timeToLockMissile, 1);
            this._computeScreenCoord(engine, player.shipCamera.getFreeCamera(), shipManager.ships[player.bestPrey].root.position, this._targetLock, interpolate);
            this._targetLock.rotation = 1. - interpolate;
            // this._targetLock.width = 0.1 - interpolate * 0.075;
            // this._targetLock.height = 0.4 - interpolate * 0.3;
            this._targetLock.isVisible = true;
            if (interpolate > 0.99) {
                this._targetLock.sourceLeft = 256;
                // this._targetLock.color = "red";
                // this._targetLock.alpha = 1;
            } else {
                this._targetLock.sourceLeft = 0;
                // this._targetLock.color = "white";
                // this._targetLock.alpha = 0.5 + interpolate * 0.5;
            }
        } else {
            this._targetLock.isVisible = false;
       }

       this._fpsCounter.text = engine.getFps().toFixed() + " fps";
    }

    public setAlpha(alpha: number):void {
        this._bars.alpha = alpha;
        this._missile.alpha = alpha;
        this._speed.alpha = alpha;
        this._health.alpha = alpha;
        this._targets.forEach(image => {
            image.alpha = alpha * 0.4;
        });
        this._targetLock.alpha = alpha * 0.4;
        this._fpsCounter.alpha = alpha;
    }

    
    private _computeScreenCoord(engine: Engine, camera: Camera, position: Vector3, image: Image, centerInterpolate: number = 1): void {
        const w = (engine.getRenderWidth() * 0.5);
        const h = engine.getRenderHeight() * 0.5;

        var spo0 = Vector4.TransformCoordinates(position, camera.getViewMatrix());
        var spo1 = Vector4.TransformCoordinates(new Vector3(spo0.x, spo0.y, spo0.z), camera.getProjectionMatrix());

        spo1.x /= spo1.w;
        spo1.y /= spo1.w;
        var l = spo1.x * w * centerInterpolate;
        var t = -spo1.y * h * centerInterpolate;
        var visible = spo1.z < 0;
        
        if (visible && spo1.z < 0)
        {
            t *= -1000;
            l *= -1000;
        }

        if (l < -w) {
            l = -w + 0.05 * w;
            visible = true;
        }
        else if (l > w) {
            l = w - 0.05 * w;
            visible = true;
        }

        if (t < -h) {
            t = -h + 0.1 * h;
            visible = true;
        }
        else if (t > h) {
            t = h - 0.1 * h;
            visible = true;
        }

        l /= this._divisor;
        l += (this._index * this._divisor - Math.floor(this._divisor / 2)) * w / this._divisor;
        image.left = l;
        image.top = t;
        image.rotation = Math.atan2(spo1.x, spo1.y) + ((spo1.z < 0) ? Math.PI : 0);
        image.isVisible = visible;
    }
}

export class HUD {
    private _adt: AdvancedDynamicTexture;
    private _enemiesRemaining: TextBlock;
    private _alliesRemaining: TextBlock;
    private _shipManager: ShipManager;
    private _counters: StackPanel;
    private _hudPanels: Array<HUDPanel>;
    private _parameters: StackPanel;
    private _touchInput : Nullable<TouchInput> = null;
    constructor(shipManager : ShipManager, assets: Assets, scene: Scene, players: Array<Ship>) {
        console.log(JSON.stringify(Object.getOwnPropertyNames(Parameters)));
        this._shipManager = shipManager;
        this._adt = AdvancedDynamicTexture.CreateFullscreenUI("HUD", true, scene);
        this._adt.layer!.layerMask = 0x10000000;

        this._hudPanels = new Array<HUDPanel>();
        for (let i = 0; i < players.length; i++) {
            this._hudPanels.push(new HUDPanel(assets, this._adt, players.length, i));
        }
        
        this._counters = new StackPanel("counters");
        this._counters.topInPixels = 20;
        this._counters.verticalAlignment = StackPanel.VERTICAL_ALIGNMENT_TOP;
        this._counters.fontFamily = "'Courier New', monospace";
        this._adt.addControl(this._counters);

        this._enemiesRemaining = new TextBlock("enemiesRemaining");
        this._enemiesRemaining.color = "white";
        this._enemiesRemaining.heightInPixels = 20;
        this._counters.addControl(this._enemiesRemaining);

        this._alliesRemaining = new TextBlock("alliesRemaining");
        this._alliesRemaining.color = "white";
        this._alliesRemaining.heightInPixels = 20;
        this._counters.addControl(this._alliesRemaining);

        if (Parameters.AIDebugLabels) {
            this._shipManager.ships.forEach(ship => {
                const text = new TextBlock("shiplable");
                this._adt.addControl(text);
                text.linkWithMesh(ship.root);
                text.color = "white";
                text.isVisible = false; // Comment out to see AI debug labels
                text.fontFamily = "'Courier New', monospace";
                ship.debugLabel = text;
            });
        }

        this._parameters = this.makeParametersPanel();
        this._parameters.horizontalAlignment = StackPanel.HORIZONTAL_ALIGNMENT_RIGHT;
        this._parameters.verticalAlignment = StackPanel.VERTICAL_ALIGNMENT_TOP;
        this._parameters.widthInPixels = 350;
        this._parameters.paddingTopInPixels = 20;
        this._parameters.isVisible = !InputManager.isTouch;
        this._adt.addControl(this._parameters);

        if (InputManager.isTouch) {
            this._touchInput = new TouchInput(this._adt, this._shipManager);
        }
    }

    tick(engine: Engine, gameSpeed: number, players: Array<Ship>) {
        this._parameters.isVisible = Settings.showParameters;
        let enemyCount = 0, allyCount = 0;
        
        this._hudPanels.forEach((hudPanel, index) => {
            hudPanel.tick(engine, players[index], this._shipManager);
        });

        this._shipManager.ships.forEach((ship, shipIndex) => {
            if (ship.isValid()) {
                if (ship.faction == 1) {
                    enemyCount++;
                } else if (!ship.isHuman) {
                    allyCount++;
                }
                if (Parameters.AIDebugLabels) {
                    const movement = `${ship.input.burst ? 'bursting' : ''}${ship.input.breaking ? 'breaking' : ''}`;
                    ship.debugLabel!.text = `${ship.state}\nidx: ${shipIndex} tgt: ${ship.bestPrey}\n${movement}`;
                    ship.debugLabel!.isVisible = Parameters.AIDebugLabels;
                }
            }
        });

        this._enemiesRemaining.text = `Enemies Remaining: ${enemyCount}`;
        this._alliesRemaining.text = `Allies Remaining: ${allyCount}`;

        // tick alpha from game speed, should hide HUD instead
        this._enemiesRemaining.alpha = gameSpeed;
        this._alliesRemaining.alpha = gameSpeed;
        this._counters.alpha = gameSpeed;
        
        this._hudPanels.forEach((hudPanel) => {
            hudPanel.setAlpha(gameSpeed);
        });

        if (this._touchInput) {
            this._touchInput.tick();
        }
    }

    private makeParametersPanel() {
        const panel = new StackPanel("parameters");
        Parameters.getParameters().forEach(param => {
            console.log(param);
            const container = new StackPanel(`${param} container`);
            container.isVertical = false;
            container.adaptHeightToChildren = true;
            container.widthInPixels = 350;
            const text = new TextBlock(`param ${param}`, param);
            text.color = 'white';
            text.fontSizeInPixels = 20;
            text.heightInPixels = 20;
            text.widthInPixels = 250;
            container.addControl(text);
            switch(typeof Parameters[param]) {
                case "number":
                case "string":
                    const input = new InputText(`${param} input`, Parameters[param]);
                    input.background = 'black';
                    input.color = 'white';
                    input.widthInPixels = 70;
                    input.onTextChangedObservable.add(() => {
                        let val = Parameters[param] as any;
                        if (typeof val === 'number') {
                            if (!isNaN(parseFloat(input.text))) {
                                val = parseFloat(input.text);
                            }
                        } else {
                            val = input.text;
                        }
                        (Parameters[param] as any) = val;
                    });
                    container.addControl(input);
                    break;
                case "boolean":
                    const checkbox = new Checkbox(`${param} input`);
                    checkbox.isChecked = Parameters[param];
                    checkbox.onIsCheckedChangedObservable.add(() => {
                        (Parameters[param] as any) = checkbox.isChecked;
                    })
                    checkbox.widthInPixels = 20;
                    checkbox.heightInPixels = 20;
                    checkbox.color = 'white';
                    container.addControl(checkbox);
                    break;
            }
            
            panel.addControl(container);
        })
        const exportButton = Button.CreateSimpleButton("export", "Copy Parameters to Clipboard");
        exportButton.background = "black";
        exportButton.color = "white";
        exportButton.onPointerDownObservable.add(() => {
            navigator.clipboard.writeText(Parameters.generateCode());
        })
        exportButton.widthInPixels = 300;
        exportButton.heightInPixels = 20;
        panel.addControl(exportButton);
        return panel;
    }

    dispose() {
        this._adt.dispose();
    }
}