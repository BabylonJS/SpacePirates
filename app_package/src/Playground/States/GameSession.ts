import { Scene, Nullable, GlowLayer } from "@babylonjs/core";
import { Game, GameDefinition } from "../Game";
import { Assets } from "../Assets";

export class GameSession {

    private _game: Nullable<Game> = null;
    private _assets: Assets;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _glowLayer: GlowLayer;

    constructor(assets: Assets, scene: Scene, canvas: HTMLCanvasElement, glowLayer: GlowLayer) {
        this._assets = assets;
        this._scene = scene;
        this._canvas = canvas;
        this._glowLayer = glowLayer;
    }

    public getScene(): Scene {
        return this._scene;
    }

    public getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    public getGame(): Nullable<Game> {
        return this._game;
    }

    public start(gameDefinition: Nullable<GameDefinition>): void {
        this._game = new Game(this._assets, this._scene, this._canvas, gameDefinition, this._glowLayer);
    }

    public stop(): void {
        if (!this._game) {
            return;
        }
        this._game.dispose();

        this._game = null;
    }

    public inProgress(): boolean {
        return !!this._game;
    }

    public pause(): void {
        this._game?.getRecorder()?.setRecordActive(false);
        this._game?.setTargetSpeed(0);
    }

    public resume(): void {
        this._game?.setTargetSpeed(1);
        this._game?.getRecorder()?.setRecordActive(true);
    }
}
