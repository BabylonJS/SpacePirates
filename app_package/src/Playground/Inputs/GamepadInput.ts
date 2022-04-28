import { DualShockButton, DualShockPad, Gamepad, GamepadManager, Xbox360Button, Xbox360Pad, _UpdateRGBDAsync } from "@babylonjs/core";
import { Settings } from "../../Settings";
import { Parameters } from "../Parameters";
import { State } from "../States/State";
import { States } from "../States/States";
import { Input, InputManager } from './Input';

export class GamepadInput {
    public static gamepads = new Array<GamepadInput>();
    _gamepad : Gamepad;
    _input: Input;
    public static initialize() {
        const gamepadManager = new GamepadManager();
        gamepadManager.onGamepadConnectedObservable.add((gamepad, state) => {
            GamepadInput.gamepads.push(new GamepadInput(gamepad, InputManager.input));
            console.log('gamepad connected');
        })
        gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state) => [
            GamepadInput.gamepads.forEach(gm => {
                if (gm._gamepad == gamepad) {
                    gm.dispose();
                }
            })
        ])

    }
    // can pass in any input to control here
    constructor(gamepad: Gamepad, input: Input) {
        this._gamepad = gamepad;
        this._input = input;
    }
    public tick() {
        const input = this._input;
        input.dx = this._gamepad.leftStick.x * Parameters.playerTurnRate * Settings.sensitivity;
        input.dy = this._gamepad.leftStick.y * Parameters.playerTurnRate * Settings.sensitivity;
        if (Settings.invertY) {
            input.dy *= -1;
        }
        input.constrainInput();
        input.breaking = (this._gamepad.rightStick.y > 0.3);
        input.burst = (this._gamepad.rightStick.y < -0.3);
        if (this._gamepad instanceof Xbox360Pad) {
            const pad = this._gamepad as Xbox360Pad;
            input.shooting = pad.rightTrigger != 0;
            input.launchMissile = pad.leftTrigger != 0;
            input.immelmann = pad.buttonLeftStick != 0;
            if (pad.buttonStart) {
                State.setCurrent(States.inGameMenu);
            }
        }
        if (this._gamepad instanceof DualShockPad) {
            const pad = this._gamepad as DualShockPad;
            input.shooting = pad.buttonR1 != 0;
            input.launchMissile = pad.rightTrigger != 0;
            input.immelmann = pad.buttonLeftStick != 0;
            if (pad.buttonOptions) {
                State.setCurrent(States.inGameMenu);
            }
        }
    }
    public dispose() {

    }
}