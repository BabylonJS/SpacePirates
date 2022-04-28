import { Texture, Engine, Vector3, Mesh, Scene, NodeMaterial, NodeMaterialBlock, Nullable, TextureBlock, RawTexture, Color3, BoundingInfo, MeshBuilder, Color4, InputBlock, ColorMergerBlock } from "@babylonjs/core";
import { MAX_MISSILES } from "../Missile";

export const MAX_TRAILS: number = 60;
export const TRAIL_LENGTH = 256;
export class Trail {
    private _data;
    private _mesh: Mesh;
    private _trackSampler0Block: Nullable<TextureBlock>;
    private _trackSampler1Block: Nullable<TextureBlock>;
    private _globalAlphaBlock: Nullable<InputBlock>;
    private _colorBlock: Nullable<InputBlock>;
    private _trailU: Nullable<InputBlock>;
    private _trailMaterial: NodeMaterial;
    private _color = new Color3(0, 0, 0);
    private _alpha: number;
    private _valid: boolean;
    private _visible: boolean = false;
    private _currentIndex: number;
    private _trailIndex: number;
    private _side: number = 0;
    private static _tempVec3 = new Vector3();
    constructor(scene: Scene, trailMaterial: NodeMaterial, trailIndex: number, maxTrails: number, data: Float32Array, texture: RawTexture)
    {
        this._data = data;
        this._mesh = MeshBuilder.CreateGround("trail", {width: 0.1, height: 0.010, subdivisionsY: 64}, scene);
        this._mesh.setBoundingInfo(new BoundingInfo(new Vector3(-1000,-1000,-1000), new Vector3(1000,1000,1000)));
        this._trailMaterial = trailMaterial.clone("trailMaterial", true);
        this._trailMaterial.backFaceCulling = false;
        this._mesh.material = this._trailMaterial;
        this._trackSampler0Block = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "tailSampler0") as TextureBlock;
        this._trackSampler1Block = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "tailSampler1") as TextureBlock;
        this._globalAlphaBlock = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "GlobalAlpha") as InputBlock;
        this._colorBlock = this._trailMaterial.getInputBlockByPredicate((b: NodeMaterialBlock) => b.name === "color");
        let trailV = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "TrailV") as InputBlock;
        this._trailU = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "TrailU") as InputBlock;
        trailV.value = (trailIndex + 0.5) / maxTrails;
        this._trailIndex = trailIndex;
        if (this._trackSampler0Block && this._trackSampler1Block) {
            this._trackSampler0Block.texture = texture;
            this._trackSampler1Block.texture = texture;
        }
        this._valid = false;
        this._alpha = 0;
        this._currentIndex = 0;
    }

    public getColor(): Color3 {
        return this._color;
    }

    public getSide(): number {
        return this._side;
    }

    public getAlpha(): number {
        return this._alpha;
    }

    public spawn(position: Vector3, side: number): void {
        const offset = TRAIL_LENGTH * 4 * this._trailIndex;
        for (let i = 0; i < TRAIL_LENGTH; i++)
        {
            const localIndex = offset + i * 4;
            this._data[localIndex + 0] = position.x;
            this._data[localIndex + 1] = position.y;
            this._data[localIndex + 2] = position.z + (i - TRAIL_LENGTH) * 0.00001;
            this._data[localIndex + 3] = 0;
        }
        this.update();
        this._valid = true;
        this._alpha = 1;
        this._side = side;
    }
    
    private _appendPosition(position: Vector3): void {
        const offset = TRAIL_LENGTH * 4 * this._trailIndex;
        const localIndex = offset + this._currentIndex * 4;
        this._data[localIndex + 0] = position.x;
        this._data[localIndex + 1] = position.y;
        this._data[localIndex + 2] = position.z;
    }

    private _getPositionToRef(position: Vector3): void {
        const offset = TRAIL_LENGTH * 4 * this._trailIndex;
        const localIndex = offset + this._currentIndex * 4;
        position.set(this._data[localIndex + 0], this._data[localIndex + 1], this._data[localIndex + 2]);
    }

    public append(position: Vector3): void {
        this._appendPosition(position);
        this.update();
    }

    public setCurrentIndex(currentIndex: number): void {
        this._currentIndex = currentIndex;
    }

    public update(): void {
        if (this._globalAlphaBlock) {
            this._globalAlphaBlock.value = this._alpha;
        }
        if (this._trailU) {
            this._trailU.value = (((this._currentIndex + 1) % TRAIL_LENGTH) + 2.5) / TRAIL_LENGTH;
        }
    }

    public setParameters(color: Color3, alpha: number): void {
        this._colorBlock!.value = color;
        this._color = color;
        this._alpha = alpha;
    }

    public setVisible(visible: boolean): void {
        this._visible = visible;
        this.tickEnabled();
    }

    public invalidate(): void {
        this._valid = false;
    }
    
    public isValid(): boolean {
        return this._valid || this._alpha > 0.001;
    }

    public tickEnabled(): void {
        this._mesh.setEnabled(this.isValid() && this._visible);
    }
    public tick(deltaTime: number, currentIndex: number): void {
        this._getPositionToRef(Trail._tempVec3);
        this._currentIndex = currentIndex;
        this._appendPosition(Trail._tempVec3);
        if (!this._valid) {
            this._alpha = Math.max(this._alpha - deltaTime * 0.0003, 0);
            this._globalAlphaBlock!.value = this._alpha;
            this.update();
        }
        this.tickEnabled();
    }

    public dispose(): void {
        this._mesh.dispose();
    }
}

export class TrailManager {

    private _trails: Array<Trail> = new Array<Trail>();
    private _currentIndex: number = TRAIL_LENGTH - 1;
    private _data;
    private _texture: RawTexture;

    constructor(scene: Scene, trailMaterial: NodeMaterial, maxTrails: number) {
        this._data = new Float32Array(maxTrails * TRAIL_LENGTH * 4);
        this._texture = RawTexture.CreateRGBATexture(this._data, TRAIL_LENGTH, maxTrails, scene, false, false, Texture.NEAREST_NEAREST, Engine.TEXTURETYPE_FLOAT);
        this._texture.wrapU = Texture.WRAP_ADDRESSMODE;
        this._texture.wrapV = Texture.WRAP_ADDRESSMODE;

        for (let i = 0; i < maxTrails; i++) {
            this._trails.push(new Trail(scene, trailMaterial, i, maxTrails, this._data, this._texture));
        }
    }

    public tick(deltaTime: number): void {
        this._trails.forEach((trail) => {
            trail.tick(deltaTime, this._currentIndex);
        });
        this._currentIndex ++;
        this._currentIndex %= TRAIL_LENGTH;
        this.update();
    }

    public spawnTrail(position: Vector3, side: number): Nullable<Trail> {
        for (let i = 0; i < this._trails.length; i++) {
            if (!this._trails[i].isValid()) {
                this._trails[i].spawn(position, side);
                return this._trails[i];
            }
        }
        return null;
    }

    public getCurrentIndex(): number {
        return this._currentIndex;
    }

    public setCurrentIndex(currentIndex: number): void {
        this._currentIndex = currentIndex;
        this._trails.forEach((trail) => {
            trail.setCurrentIndex(currentIndex);
        });
    }

    public getData(): Float32Array {
        return this._data;
    }

    public update(): void {
        this._texture.update(this._data);
    }

    public getTrails(): Array<Trail> {
        return this._trails;
    }

    public dispose(): void {
        this._trails.forEach((trail) => {
            trail.dispose();
        });
        this._texture.dispose();
    }
}