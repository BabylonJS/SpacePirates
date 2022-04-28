import { Vector3, Scene, MeshBuilder, StandardMaterial, Color3, Nullable, Quaternion, Animation, Mesh, AbstractMesh, NodeMaterial, GlowLayer } from "@babylonjs/core";
import { Assets } from "../Assets";
import { SparksEffect } from "./SparksEffect";

export const MAX_EXPLOSIONS = 4;
const SPARK_COUNT_EXPLOSION = 100;
const EXPLOSION_TIMEOUT = 2000;
export class Explosion {
    private _explosionMesh: Nullable<AbstractMesh> = null;
    private _sparkEffect: SparksEffect;
    private _time: number = 9999; // in milliseconds

    constructor(scene: Scene, assets: Assets, glowLayer: GlowLayer) {
        this._sparkEffect = new SparksEffect(scene, assets, SPARK_COUNT_EXPLOSION);
        if (assets.explosionMesh && assets.explosionMaterial) {
            this._explosionMesh = assets.explosionMesh?.clone("explosionClone", null);
            if (this._explosionMesh) {
                //GLOW LAYER ISSUE
                glowLayer.referenceMeshToUseItsOwnMaterial(this._explosionMesh);
                this._explosionMesh.material = assets.explosionMaterial.clone("explosionMaterialClone", true);
                if (this._explosionMesh.material) {
                    
                    //this._explosionMesh.material.getBlockByName("noiseTex").texture = material.noiseTexture;
                    (this._explosionMesh.material as any).getBlockByName("rand").value = Math.random();
                    (this._explosionMesh.material as any).getBlockByName("timeout").value = EXPLOSION_TIMEOUT / 1000;
                    (this._explosionMesh.material as any).getBlockByName("startTime").value = 0;
                }
            }
        }

        this.tickEnabled();
    }

    public setTime(timeMs: number): void {
        this._time = timeMs;
        const scale = 1.0 + timeMs * 0.04;
        const visibility = 1.0 - timeMs * 0.001;
        if (this._explosionMesh) {
            (this._explosionMesh.material as any).getBlockByName("Time").value = timeMs / 1000;
        }

        this._sparkEffect.setTime(timeMs);

        this.tickEnabled();
    }

    public addDeltaTime(deltaTimeMs: number): void {
        this.setTime(this._time + deltaTimeMs);
    }

    public tickEnabled(): void {
        if (this._explosionMesh) {
            this._explosionMesh.setEnabled(this._time < EXPLOSION_TIMEOUT);
        }
        this._sparkEffect.tickEnable();
    }

    public setPositionOrientation(position: Vector3, orientation: Quaternion): void {
        if (this._explosionMesh) {
            this._explosionMesh.rotationQuaternion?.copyFrom(orientation);
            this._explosionMesh.position.copyFrom(position);
        }
        this._sparkEffect.setPositionOrientation(position, orientation);
    }

    public valid(): boolean {
        return this._time >= 0 && this._time <= EXPLOSION_TIMEOUT;
    }

    public getTime(): number {
        return this._time;
    }

    public getPosition(): Vector3 {
        if (this._explosionMesh) {
            return this._explosionMesh.position;
        } else {
            return Vector3.Zero();
        }
    }

    public getOrientation(): Quaternion {
        if (this._explosionMesh) {
            return this._explosionMesh.rotationQuaternion ? this._explosionMesh.rotationQuaternion : Quaternion.Identity();
        } else {
            return Quaternion.Identity();
        }
    }

    public dispose(): void {
        this._explosionMesh?.dispose();
        this._sparkEffect.dispose();
    }
}

export class ExplosionManager {
    private _explosions = new Array<Explosion>();

    constructor(scene: Scene, assets: Assets, glowLayer: GlowLayer) {
        for(let i = 0; i < MAX_EXPLOSIONS; i++) {
            this._explosions.push(new Explosion(scene, assets, glowLayer));
        }
    }

    public getExplosions(): Array<Explosion> {
        return this._explosions;
    }

    public spawnExplosion(position: Vector3, orientation: Quaternion): void {
        for (let i = 0; i < this._explosions.length; i++) {
            const explosion = this._explosions[i];
            if (!explosion.valid()) {
                explosion.setPositionOrientation(position, orientation);
                explosion.setTime(0);
                return;
            }
        }
    }

    public tick(deltaTime: number): void {
        this._explosions.forEach((explosion) => {
            explosion.addDeltaTime(deltaTime);
            explosion.tickEnabled();
        });
    }

    public dispose(): void {
        this._explosions.forEach((explosion) => {
            explosion.dispose();
        });
    }
}
