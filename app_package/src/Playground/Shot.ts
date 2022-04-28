import { Mesh, Scene, BoxBuilder, Matrix, StandardMaterial, Color3, Vector3, MeshBuilder, Nullable, VertexData, VertexBuffer, Engine, GlowLayer } from "@babylonjs/core";
import { Assets } from "./Assets";
import { Ship } from "./Ship"
import { World } from "./World";

/// <reference lib="dom" />

export const MAX_SHOTS = 200;

export class Shot
{
    ttl:number = 0;
    firedBy?: Ship;
}

export class ShotManager {

    public shots = Array<Shot>();
    private _matricesData = new Float32Array(16 * MAX_SHOTS);
    private _colorData = new Float32Array(4 * MAX_SHOTS);
    private _shotMesh: Nullable<Mesh> = null;
    private _tmpVec3: Vector3 = new Vector3();

    constructor(assets: Assets, scene: Scene, glowLayer: GlowLayer)
    {
        if (!assets.projectile) {
            return;
        }
        var arrayPos = assets.projectile.getVerticesData(VertexBuffer.PositionKind);
        var arrayIndex = assets.projectile.getIndices();

        var shotMesh = new Mesh("custom", scene);
        var vertexData = new VertexData();

        vertexData.positions = arrayPos;
        vertexData.indices = arrayIndex;

        vertexData.applyToMesh(shotMesh);

        var m = Matrix.Zero();
        var index = 0;

        for (var shot = 0; shot < MAX_SHOTS; shot++) {
            this.shots.push({ttl:-1});

            m.copyToArray(this._matricesData, index * 16);

            this._colorData[index * 4 + 0] = 1;
            this._colorData[index * 4 + 1] = 0;
            this._colorData[index * 4 + 2] = 0;
            this._colorData[index * 4 + 3] = 1;

            index++;
        }

        shotMesh.thinInstanceSetBuffer("matrix", this._matricesData, 16, false);
        shotMesh.thinInstanceSetBuffer("color", this._colorData, 4, false);

        //GLOW LAYER ISSUE
        glowLayer.referenceMeshToUseItsOwnMaterial(shotMesh);

        var mat = new StandardMaterial("material", scene);
        shotMesh.material = mat;
        mat.disableLighting = true;
        mat.emissiveColor = Color3.White();
        mat.alphaMode = Engine.ALPHA_ADD;
        mat.alpha = 0.33;
        this._shotMesh = shotMesh;
    }

    public getMatrixData(): Float32Array {
        return this._matricesData;
    }

    public getColorData(): Float32Array {
        return this._colorData;
    }

    public getMatrices() : Float32Array {
        return this._matricesData;
    }

    public addShot(ship: Ship, worldMatrix: Matrix, isHuman: boolean, cannonIndex: number): void {
        for (var index = 0; index < MAX_SHOTS; index++) {
            
            if (this.shots[index].ttl <= 0) {
                const flIndex = index * 16;
                const clIndex = index * 4;

                if (ship.cannonR && ship.cannonL) {
                    const cannonLocalOffset = (cannonIndex ? ship.cannonR : ship.cannonL).clone();
                    cannonLocalOffset.z += 0.2;
                    const offsetCannon = Vector3.TransformNormal(cannonLocalOffset.scale(25), worldMatrix);
                    worldMatrix.copyToArray(this._matricesData, index * 16);
                    this._matricesData[flIndex + 12] += offsetCannon.x;
                    this._matricesData[flIndex + 13] += offsetCannon.y;
                    this._matricesData[flIndex + 14] += offsetCannon.z;

                    this._colorData[clIndex] = isHuman ? 1 : 0;
                    this._colorData[clIndex+1] = isHuman ? 0 : 1;
                    this._colorData[clIndex+2] = 0;
                    this.shots[index].ttl = 5000;
                    this.shots[index].firedBy = ship;
                }
                return;
            }
        }
    }

    public tick(deltaTime: number, world: World): void {
        const shootSpeed = 0.5;

        for (var index = 0; index < MAX_SHOTS; index++) {
            const flIndex = index * 16;
            if (this.shots[index].ttl > 0) {
                this._matricesData[flIndex + 12] += this._matricesData[flIndex + 8] * shootSpeed * deltaTime;
                this._matricesData[flIndex + 13] += this._matricesData[flIndex + 9] * shootSpeed * deltaTime;
                this._matricesData[flIndex + 14] += this._matricesData[flIndex + 10] * shootSpeed * deltaTime;
                this.shots[index].ttl -= deltaTime;
                this._tmpVec3.set(this._matricesData[flIndex + 12], this._matricesData[flIndex + 13], this._matricesData[flIndex + 14])
                if (world.collideWithAsteroids(this._tmpVec3, 6)) {
                    this.shots[index].ttl = -1;
                }
            } else {
                for (let i = 0;i<16;i++) {
                    this._matricesData[flIndex + i] = 0;
                }
            }
        }
        this.matricesToInstances();
    }

    public matricesToInstances(): void {
        if (this._shotMesh) {
            this._shotMesh.thinInstanceBufferUpdated("matrix");
            this._shotMesh.thinInstanceBufferUpdated("color");
        }
    }

    public dispose(): void {
        if (this._shotMesh) {
            this._shotMesh.dispose();
        }
    }
}