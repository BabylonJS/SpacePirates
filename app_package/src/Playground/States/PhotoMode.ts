import { Button, Checkbox, Control, RadioButton, Slider, StackPanel, TextBlock } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { ArcRotateCamera, Camera, CreateScreenshot, FreeCamera, KeyboardEventTypes, KeyboardInfo, Nullable, Observer, Quaternion, Scene, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { Ship } from "../Ship";
import { InputManager } from "../Inputs/Input";
import { GameState } from "./GameState";
import { Recorder } from "../Recorder/Recorder";
import { PlanetBaker } from "../FX/PlanetBaker";
import { Assets } from "../Assets";
import { World } from "../World";
import { Parameters } from "../Parameters";

export class PhotoMode extends State {
    public ship: Nullable<Ship> = null;
    private _gameCamera: Nullable<Camera> = null;
    private _zeroCamera: Nullable<Camera> = null;
    private _photoCamera: Nullable<Camera> = null;
    private _photoArcRotateCamera: Nullable<ArcRotateCamera> = null;
    private _photoFreeCamera: Nullable<FreeCamera> = null;
    private _scene: Nullable<Scene> = null;
    private _recorder: Nullable<Recorder> | undefined = null;
    private _canvas: Nullable<HTMLCanvasElement> | undefined = null;
    private _hotkeyObservable: Nullable<Observer<KeyboardInfo>> = null;
    public assets: Nullable<Assets> = null;
    private sunCamera: Nullable<VolumetricLightScatteringPostProcess> = null;

    private _renderObserver: Nullable<Observer<Scene>> = null;
    public exit() {
        super.exit();

        this._clearPP();
        if (this._scene && this._canvas) {
            this._photoCamera?.detachControl();
            this._scene.activeCamera = this._gameCamera;
            if (this._scene.activeCameras?.length && this._zeroCamera) {
                this._scene.activeCameras[0] = this._zeroCamera;
            }
        }
        if (this._scene && this._hotkeyObservable) {
            this._scene.onKeyboardObservable.remove(this._hotkeyObservable);
        }

        const scene = GameState.gameSession?.getScene();
        if (scene) {
            scene.onBeforeRenderObservable.remove(this._renderObserver);
        }
    }

    private _clearPP(): void {
        if (this._photoCamera && this.sunCamera) {
            this.sunCamera.mesh.dispose();
            this.sunCamera.dispose(this._photoCamera);
        }
    }

    public enter() {
        super.enter();
        if (!this._adt) {
            return;
        }

        const scene = GameState.gameSession?.getScene();
        if (!scene) {
            return;
        }

        const game = GameState.gameSession?.getGame();
        if (!game) {
            return;
        }

        this._scene = scene;
        this._gameCamera = (scene.activeCameras?.length && scene.activeCameras[0]) ? scene.activeCameras[0]: scene.activeCamera;
        this._canvas = GameState.gameSession?.getCanvas();
        this._recorder = GameState.gameSession?.getGame()?.getRecorder();
        if (!this._recorder) {
            return;
        }
        if (scene.activeCameras) {
            this._zeroCamera = scene.activeCameras[0];
        }

        InputManager.disablePointerLock();

        var panel = new StackPanel();
        panel.verticalAlignment =Control.VERTICAL_ALIGNMENT_TOP;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.width = 0.2;

        var _this = this;

        this._hotkeyObservable = scene.onKeyboardObservable.add((kbInfo: any) => {
            switch (kbInfo.type) {
              case KeyboardEventTypes.KEYDOWN:
                if (kbInfo.event.key == 'h') {
                    panel.alpha = (panel.alpha === 0)? 1 : 0;
                } else if (kbInfo.event.key == ' ') {
                    _this._recorder?.stop();
                    panel.alpha = 1;
                } else if (kbInfo.event.key == '-') {
                    (_this._photoCamera as ArcRotateCamera).radius *= 0.99;
                } else if (kbInfo.event.key == '+') {
                    (_this._photoCamera as ArcRotateCamera).radius *= 1.01;
                }
                break;
            }
        });

        this._renderObserver = scene.onBeforeRenderObservable.add( () => {
            if (this.sunCamera && this._photoCamera) {
                World.updateSunPostProcess(this._photoCamera.position, this.sunCamera.mesh);
            }
        });

        this._addTextLabel("Press 'h' to toggle UI", panel);
        this._addTextLabel("Press space to stop playback", panel);
        this._addTextLabel("Frame", panel);
        var frameSlider = new Slider("frame");
        //frameSlider.width = 0.2;
        frameSlider.height = "40px";
        frameSlider.color = "white";
        frameSlider.background = "grey";
        frameSlider.minimum = 0;
        frameSlider.step = 1;
        let framesAvailable = this._recorder.getAvailableFrames();
        framesAvailable = framesAvailable ? framesAvailable : 0;
        frameSlider.maximum = framesAvailable - 1;
        frameSlider.value = framesAvailable - 1;
        panel.addControl(frameSlider);

        this._addPlaybackButton(1, panel);
        this._addPlaybackButton(0.5, panel);
        this._addPlaybackButton(0.25, panel);
        this._addPlaybackButton(0.125, panel);
        this._addButton("Stop", panel).onPointerDownObservable.add(function(info) {
            _this._recorder?.stop();
        });

        this._addCameraRadioButton("Rotate Camera", panel, true).onIsCheckedChangedObservable.add(function(state) {
            if (state) {
                _this._bindArcRotateCamera();
            }
        });
        this._addCameraRadioButton("Free Camera", panel).onIsCheckedChangedObservable.add(function(state) {
            if (state) {
               _this._bindFreeCamera();
            }
        });
        this._addTextLabel("Distance", panel);
        var distanceSlider = new Slider("Distance");
        distanceSlider.height = "40px";
        distanceSlider.color = "white";
        distanceSlider.background = "grey";
        distanceSlider.minimum = 2;
        distanceSlider.maximum = 50;
        distanceSlider.value = 10;
        panel.addControl(distanceSlider);

        this._addTextLabel("Roll", panel);
        var rollSlider = new Slider("roll");
        rollSlider.height = "40px";
        rollSlider.color = "white";
        rollSlider.background = "grey";
        rollSlider.minimum = 0;
        rollSlider.maximum = Math.PI * 2;
        rollSlider.value = 0;
        panel.addControl(rollSlider);

        this._addCheck("Allies Trail", panel).onIsCheckedChangedObservable.add(function(value) {
            if (_this._recorder) {
                _this._recorder._trailVisibilityMask ^= 1;
                _this._recorder.refreshFrame();
            }
        });

        this._addCheck("Enemies Trail", panel).onIsCheckedChangedObservable.add(function(value) {
            if (_this._recorder) {
                _this._recorder._trailVisibilityMask ^= 2;
                _this._recorder.refreshFrame();
            }
        });

        this._addButton("Take screen shot", panel).onPointerDownObservable.add(function(info) {
            panel.alpha = 0;
            if (_this._scene && _this._photoCamera) {
                CreateScreenshot(_this._scene.getEngine(), _this._photoCamera, 1920, () => {
                    panel.alpha = 1;
                }, "image/png", true);
            }
        });

        this._addButton("Back to game menu", panel).onPointerDownObservable.add(function(info) {
            State.setCurrent(States.inGameMenu);
        });

        this._adt.addControl(panel);

        // arc rotate camera
        const position = (game.humanPlayerShips.length && game.humanPlayerShips[0]) ? game.humanPlayerShips[0].root.position : new Vector3(0, 0, 0);
        this._photoArcRotateCamera = new ArcRotateCamera("cam", 0.5, 0.5, 10, position, scene);
        this._photoFreeCamera = new FreeCamera("cam", position.clone(), scene);

        this._bindArcRotateCamera();

        distanceSlider.onValueChangedObservable.add(function(value) {
            (_this._photoCamera as ArcRotateCamera).radius = value;
        });

        rollSlider.onValueChangedObservable.add(function(value) {
            (_this._photoCamera as ArcRotateCamera).upVector = new Vector3(Math.cos(value), Math.sin(value), 0);
        });

        frameSlider.onValueChangedObservable.add(function(value) {
            _this._recorder?.applyFrame(value);
        });

        this._recorder?.applyFrame(framesAvailable - 1);
    }

    private _addTextLabel(text: string, panel: StackPanel): TextBlock {
        var textBlock = new TextBlock();
        textBlock.text = text;
        textBlock.fontSize = 24;
        //textBlock.width = 0.2;
        textBlock.height = "40px";
        textBlock.color = "white";
        Parameters.setFont(textBlock, false);
        panel.addControl(textBlock);
        return textBlock;
    }

    private _addCheck(text: string, panel: StackPanel)
    {
        const check = new Checkbox("Enemies Trail");
        check.width = "20px";
        check.height = "20px";
        check.isChecked = true;
        check.color = "white";

        var header = Control.AddHeader(check, text, "200px", { isHorizontal: true, controlFirst: true });
        header.height = "30px";
        header.color = "white";
        header.background = "grey";
        Parameters.setFont(header, false);
        panel.addControl(header);
        return check;
    }

    private _addButton(text: string, panel: StackPanel): Button {
        var button = Button.CreateSimpleButton("button", text.toUpperCase());
        button.height = "40px";
        button.color = "white";
        button.background = "grey";
        Parameters.setFont(button, true);
        panel.addControl(button);
        return button;
    }

    private _addCameraRadioButton(text: string, panel: StackPanel, checked: boolean = false): RadioButton {
        var button = new RadioButton();
        button.width = "20px";
        button.height = "20px";
        button.color = "white";
        button.background = "grey";
        button.isChecked = checked;

        var header = Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
        header.height = "30px";
        header.color = "white";
        header.background = "grey";
        Parameters.setFont(header, false); 
        panel.addControl(header);
        return button;
    }

    private _addPlaybackButton(speed: number, panel: StackPanel): Button {
        var _this = this;
        var button = this._addButton("Play " + speed, panel);
        button.onPointerDownObservable.add(function(info) {
            panel.alpha = 0;
            _this._recorder?.playback(speed, () =>{
                panel.alpha = 1;
            });
        });
        return button;
    }

    private _bindArcRotateCamera() : void {
        this._clearPP();
        this._photoCamera = this._photoArcRotateCamera;
        if (this._scene) {
            this._scene.activeCamera = this._photoCamera;
            if (this._scene.activeCameras?.length && this._photoCamera) {
                this._scene.activeCameras[0] = this._photoCamera;
            }
            (this._photoCamera as ArcRotateCamera).attachControl(this._canvas, true);

            if (this._photoCamera && this.assets) {
                this.sunCamera = PlanetBaker.CreateSunPostProcess(this._photoCamera, this._scene, this.assets);
            }
        }
    }

    private _bindFreeCamera() : void {
        this._clearPP();
        this._photoCamera = this._photoFreeCamera;
        if (this._scene) {
            this._scene.activeCamera = this._photoCamera;
            if (this._scene.activeCameras?.length && this._photoCamera) {
                this._scene.activeCameras[0] = this._photoCamera;
            }
            (this._photoCamera as FreeCamera).attachControl(this._canvas, true);

            if (this._photoCamera && this.assets) {
                this.sunCamera = PlanetBaker.CreateSunPostProcess(this._photoCamera, this._scene, this.assets);
            }
        }
    }
}