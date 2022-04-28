import { Color3, AbstractMesh, Quaternion, Vector3, Mesh, Matrix, Scene, TransformNode, Engine, Nullable } from "@babylonjs/core";
import { Agent } from "./Agent";
import { Ship } from "./Ship";
import { Trail, TrailManager } from "./FX/Trail";
import { ExplosionManager } from "./FX/Explosion";
import { World } from "./World";

export const MAX_MISSILES: number = 10;
export const MISSILE_MAX_LIFE: number = 10000; // in milliseconds

export class Missile extends Agent {
    private _trail: Nullable<Trail> = null;
    public shipToChase: Nullable<Ship> = null;
    public time: number = 99999;
    public firedBy: Nullable<Ship> = null;

    constructor(scene: Scene) {
        super();
    }

    public launch(shipToChase: Ship, firedBy: Ship, worldPosition: Vector3, worldOrientation: Quaternion, missileTransform: TransformNode, trailManager: TrailManager): void
    {
        this.transformNode = missileTransform;
        this.input.dx = 0;
        this.input.dy = 0;
        this.shipToChase = shipToChase;
        this.firedBy = firedBy;
        this.time = 0;
        this.setPositionOrientation(worldPosition, worldOrientation);
        this._trail = trailManager.spawnTrail(worldPosition, 3);
        this._trail?.setParameters(Color3.White(), 1);
        this._trail?.setVisible(true);
    }

    dispose() {
        this.transformNode?.dispose();
        //this._trail.dispose();
    }

    // return true if still valid
    public tick(rx: Quaternion, ry: Quaternion, deltaTimeMs: number): boolean {

        if (this.setTime(this.time + deltaTimeMs)) {
            this.quat = this.quat.multiply(rx).multiply(ry);
            this.quat.normalize();
            if (this.transformNode) {
                if (this.transformNode.rotationQuaternion) {
                    this.transformNode.rotationQuaternion = Quaternion.Slerp(this.transformNode.rotationQuaternion, this.quat, 1.);
                }
                this.transformNode.position.addInPlace(this.forward.scale(0.15 * deltaTimeMs));
                if (deltaTimeMs > 0.001) {
                    this._trail?.append(this.transformNode.position);
                }
            }
            return true;
        } else {
            return false;
        }
    }

    public getWorldMatrix(): Matrix {
        if (this.transformNode) {
            return this.transformNode.getWorldMatrix();
        } else {
            return Matrix.Identity();
        }
    }

    public getPosition(): Vector3 {
        if (this.transformNode) {
            return this.transformNode.position;
        } else {
            return Vector3.Zero();
        }
    }

    public getOrientation(): Quaternion {
        if (this.transformNode && this.transformNode.rotationQuaternion) {
            return this.transformNode.rotationQuaternion;
        } else {
            return Quaternion.Identity();
        }
    }

    // return true if still valid
    public setTime(timeMs: number): boolean {
        this.time = timeMs;
        if (timeMs > MISSILE_MAX_LIFE) {
            this.transformNode?.setEnabled(false);
            this._trail?.invalidate();
            return false;
        }
        this.transformNode?.setEnabled(true);
        return true;
    }

    public tickEnabled(): void {
        this.transformNode?.setEnabled(this.time < MISSILE_MAX_LIFE);
        this._trail?.tickEnabled();
    }

    public getTime(): number {
        return this.time;
    }

    public isValid(): boolean {
        return this.time >= 0 && this.time <= MISSILE_MAX_LIFE;
    }

    public setPositionOrientation(position: Vector3, orientation: Quaternion): void {
        if (this.transformNode) {
            this.transformNode.position.copyFrom(position);
            this.transformNode.rotationQuaternion?.copyFrom(orientation);
            this.quat.copyFrom(orientation);
            this.position.copyFrom(position);
        }
    }
}

export class MissileManager {
    missiles = Array<Missile>();
    private _tmpMatrix = new Matrix();
    private _trailManager: TrailManager;

    constructor(scene: Scene, trailManager: TrailManager) {
        this._trailManager = trailManager;
        for (let i = 0; i < MAX_MISSILES; i++) {
            this.missiles.push(new Missile(scene));
        }
    }

    public getMissiles(): Array<Missile> {
        return this.missiles;
    }

    public fireMissile(position: Vector3, quaternion: Quaternion, shipToChase: Ship, firedBy: Ship, missileTransform: TransformNode): Nullable<Missile> {
        for (let i = 0; i < MAX_MISSILES; i++) {
            if (!this.missiles[i].isValid()) {
                this.missiles[i].launch(shipToChase, firedBy, position, quaternion, missileTransform, this._trailManager);
                return this.missiles[i];
            }
        }
        return null;
    }

    public tick(deltaTime: number, explosionManager: ExplosionManager, world: World): void {
        for(let i = 0; i < this.missiles.length; i++) {
            const missile = this.missiles[i];
            missile.tickEnabled();
            if (!missile.isValid()) {
                continue;
            }
            var wmat = missile.getWorldMatrix();
            if (!wmat || !missile.transformNode || !missile.isValid()) {
                continue;
            }

            const forward = new Vector3(wmat.m[8], wmat.m[9], wmat.m[10]);
            const right = new Vector3(wmat.m[0], wmat.m[1], wmat.m[2]);
            const up = new Vector3(wmat.m[4], wmat.m[5], wmat.m[6]);
            missile.forward = forward;
            missile.up = up;
            missile.right = right;

            let keepMissile = missile.shipToChase && missile.shipToChase.isValid();

            if (world.collideWithAsteroids(missile.transformNode.position, 0.5)) {
                keepMissile = false;
                missile.setTime(MISSILE_MAX_LIFE + 1);
            }
            if (keepMissile && missile.shipToChase) {
                const aimPos = missile.shipToChase.root.position;
                const turnRatio = Math.min(missile.time / 100000, 0.05);
                const dotTgt = missile.goToward(aimPos, missile.transformNode.position, turnRatio);

                const rx = Quaternion.RotationAxis(new Vector3(0,1,0), missile.input.dx);
                rx.toRotationMatrix(this._tmpMatrix);
                const ry = Quaternion.RotationAxis(new Vector3(this._tmpMatrix.m[0], this._tmpMatrix.m[1], this._tmpMatrix.m[2]), missile.input.dy);
                keepMissile = missile.tick(rx, ry, deltaTime);
            }
            if (!keepMissile)
            {
                explosionManager.spawnExplosion(missile.getPosition(), missile.getOrientation());
            }
        }
    }

    public invalidateMissileChasing(shipToChase: Ship): void {
        for(let i = 0; i < this.missiles.length; i++) {
            const missile = this.missiles[i];
            if (missile.isValid() && missile.shipToChase == shipToChase) {
                missile.setTime(MISSILE_MAX_LIFE + 1);
                return;
            }
        }
    }

    dispose() {
        this.missiles.forEach(missile => {
            missile.dispose();
        });
    }
}