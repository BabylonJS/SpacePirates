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
            index++;
        }

        shotMesh.thinInstanceSetBuffer("matrix", this._matricesData, 16, false);

        //GLOW LAYER ISSUE
        glowLayer.referenceMeshToUseItsOwnMaterial(shotMesh);

        var mat = assets.projectileShader?.clone("projectiles");
        if (mat) {
            shotMesh.material = mat;
            mat.alphaMode = Engine.ALPHA_ADD;
        }
        this._shotMesh = shotMesh;
    }

    public getMatrixData(): Float32Array {
        return this._matricesData;
    }

    public getMatrices() : Float32Array {
        return this._matricesData;
    }

    public addShot(ship: Ship, worldMatrix: Matrix, isHuman: boolean, cannonIndex: number): void {
        const startIndex = ship.faction ? (MAX_SHOTS / 2) : 0;
        for (var index = startIndex; index < (startIndex + MAX_SHOTS / 2); index++) {
            
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
        }
    }

    public dispose(): void {
        if (this._shotMesh) {
            this._shotMesh.dispose();
        }
    }
}