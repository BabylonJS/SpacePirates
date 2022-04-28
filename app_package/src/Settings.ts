import { Engine } from "@babylonjs/core";

export class Settings {
    private static _volume = 1.0;
    public static set volume(volume: number) {
        this._volume = volume;
        Engine.audioEngine?.setGlobalVolume(this._volume);
    }
    public static get volume() {
        return this._volume;
    }
    public static sensitivity = 1.0;
    public static showParameters = false;
    public static invertY = false;
}