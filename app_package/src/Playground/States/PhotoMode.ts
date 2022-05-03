import { Button, Grid, Checkbox, Control, RadioButton, Slider, StackPanel, TextBlock, Rectangle } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { ArcRotateCamera, Camera, CreateScreenshot, FreeCamera, KeyboardEventTypes, KeyboardInfo, Nullable, Observer, Quaternion, Scene, Vector2, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { Ship } from "../Ship";
import { InputManager } from "../Inputs/Input";
import { GameState } from "./GameState";
import { Recorder } from "../Recorder/Recorder";
import { PlanetBaker } from "../FX/PlanetBaker";
import { Assets } from "../Assets";
import { World } from "../World";
import { Parameters } from "../Parameters";
import { GuiFramework } from "../GuiFramework";
import { roadProceduralTexturePixelShader } from "@babylonjs/procedural-textures/road/roadProceduralTexture.fragment";

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
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        const grid = new Grid();
        grid.paddingBottom = "100px";
        grid.paddingLeft = "100px";
        GuiFramework.formatButtonGrid(grid);
        grid.addControl(panel, 0, 0);
        const controlsGrid: Grid = GuiFramework.createScreenshotGrid();
        grid.addControl(controlsGrid, 0, 0)

        var _this = this;

        this._hotkeyObservable = scene.onKeyboardObservable.add((kbInfo: any) => {
            switch (kbInfo.type) {
              case KeyboardEventTypes.KEYDOWN:
                if (kbInfo.event.key == 'h') {
                    panel.alpha = (panel.alpha === 0)? 1 : 0;
                    controlsGrid.alpha = (controlsGrid.alpha === 0)? 1 : 0;
                } else if (kbInfo.event.key == ' ') {
                    _this._recorder?.stop();
                    panel.alpha = 1;
                    controlsGrid.alpha = 1;
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

        GuiFramework.createScreenshotText(controlsGrid, new Vector2(0, 1), "'h' to toggle UI", true);
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(1, 1), "Space to stop playback", true);
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(2, 0), "Ally Trails");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(3, 0), "Enemy Trails");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(4, 0), "Rotate Camera");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(5, 0), "Free Camera");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(6, 0), "Distance");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(7, 0), "Roll");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(8, 0), "Frame");

        const rotateCam: RadioButton = GuiFramework.createRadioButton(true);
        rotateCam.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rotateCam.onIsCheckedChangedObservable.add(function(state) {
            if (state) {
                _this._bindArcRotateCamera();
            }
        });
        controlsGrid.addControl(rotateCam, 4, 1);

        const freeCam: RadioButton = GuiFramework.createRadioButton();
        freeCam.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        freeCam.onIsCheckedChangedObservable.add(function(state) {
            if (state) {
                _this._bindFreeCamera();
            }
        });
        controlsGrid.addControl(freeCam, 5, 1);

        const frameSlider: Slider = GuiFramework.createSlider(2, 50, 10);
        frameSlider.width = 0.9;
        controlsGrid.addControl(frameSlider, 8, 1);
        let framesAvailable = this._recorder.getAvailableFrames();
        framesAvailable = framesAvailable ? framesAvailable : 0;
        frameSlider.maximum = framesAvailable - 1;
        frameSlider.value = framesAvailable - 1;
        frameSlider.step = 1;
        frameSlider.onValueChangedObservable.add(function(value) {
            _this._recorder?.applyFrame(value);
        });

        const distanceSlider: Slider = GuiFramework.createSlider(2, 50, 10);
        distanceSlider.width = 0.9;
        controlsGrid.addControl(distanceSlider, 6, 1);
        distanceSlider.onValueChangedObservable.add(function(value) {
            (_this._photoCamera as ArcRotateCamera).radius = value;
        });

        const rollSlider: Slider = GuiFramework.createSlider(0, Math.PI * 2);
        rollSlider.width = 0.9;
        controlsGrid.addControl(rollSlider, 7, 1);
        rollSlider.onValueChangedObservable.add(function(value) {
            (_this._photoCamera as ArcRotateCamera).upVector = new Vector3(Math.cos(value), Math.sin(value), 0);
        });

        const allyTrailsCheck: Checkbox = GuiFramework.createCheckbox();
        allyTrailsCheck.isChecked = true;
        allyTrailsCheck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        allyTrailsCheck.onIsCheckedChangedObservable.add(function(value) {
            if (_this._recorder) {
                _this._recorder._trailVisibilityMask ^= 1;
                _this._recorder.refreshFrame();
            }
        });
        controlsGrid.addControl(allyTrailsCheck as Checkbox, 2, 1);
        const enemyTrailsCheck: Checkbox = GuiFramework.createCheckbox();
        enemyTrailsCheck.isChecked = true;
        enemyTrailsCheck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        enemyTrailsCheck.onIsCheckedChangedObservable.add(function(value) {
            if (_this._recorder) {
                _this._recorder._trailVisibilityMask ^= 2;
                _this._recorder.refreshFrame();
            }
        });
        controlsGrid.addControl(enemyTrailsCheck as Checkbox, 3, 1);
    
        this._addPlaybackButton(1, panel, controlsGrid);
        this._addPlaybackButton(0.5, panel, controlsGrid);
        this._addPlaybackButton(0.25, panel, controlsGrid);
        this._addPlaybackButton(0.125, panel, controlsGrid);
        GuiFramework.addButton("Stop", panel).onPointerDownObservable.add(function(info) {
            _this._recorder?.stop();
        });

        GuiFramework.addButton("Screen shot", panel).onPointerDownObservable.add(function(info) {
            panel.alpha = 0;
            controlsGrid.alpha = 0;
            if (_this._scene && _this._photoCamera) {
                CreateScreenshot(_this._scene.getEngine(), _this._photoCamera, 1920, () => {
                    panel.alpha = 1;
                    controlsGrid.alpha = 1;
                }, "image/png", true);
            }
        });

        GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function(info) {
            State.setCurrent(States.inGameMenu);
        });

        this._adt.addControl(grid);

        // arc rotate camera
        const position = (game.humanPlayerShips.length && game.humanPlayerShips[0]) ? game.humanPlayerShips[0].root.position : new Vector3(0, 0, 0);
        this._photoArcRotateCamera = new ArcRotateCamera("cam", 0.5, 0.5, 10, position, scene);
        this._photoFreeCamera = new FreeCamera("cam", position.clone(), scene);
        this._bindArcRotateCamera();
        this._recorder?.applyFrame(framesAvailable - 1);
    }

    private _addPlaybackButton(speed: number, panel: StackPanel, controlsGrid: Grid): Button {
        var _this = this;
        var button = GuiFramework.addButton("Play " + speed, panel);
        button.onPointerDownObservable.add(function(info) {
            panel.alpha = 0;
            controlsGrid.alpha = 0;
            
            _this._recorder?.playback(speed, () =>{
                panel.alpha = 1;
                controlsGrid.alpha = 1;
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