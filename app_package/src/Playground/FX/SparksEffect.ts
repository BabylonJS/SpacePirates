import { Vector3, Scalar, Scene, NodeMaterial, SolidParticleSystem, MeshBuilder, Engine, Quaternion, Color4, Nullable, Observer } from "@babylonjs/core";
import { Assets } from "../Assets";


const SPARK_COUNT_SHOT = 10;
const MAX_SHOTS = 30;

export class SparksEffect {
    private _SPS: SolidParticleSystem;
    private _time: number; // in milliseconds
    private _renderObserver: Nullable<Observer<Scene>> = null;
    private _scene: Scene;

    constructor(scene: Scene, assets: Assets, sparkCount: number)
    {
        this._scene = scene;
        this._SPS = new SolidParticleSystem("SPS", scene);
        const plane = MeshBuilder.CreatePlane("", {size:0.000001});
        this._SPS.addShape(plane, sparkCount);
        plane.dispose();

        this._time = 9999;
        const mesh = this._SPS.buildMesh();
        mesh.visibility = 0.99;
        mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);

        // initiate particles function
        this._SPS.initParticles = () => {
            for (let p = 0; p < this._SPS.nbParticles; p++) {
                const particle = this._SPS.particles[p];

                const nga = Scalar.RandomRange(-Math.PI, Math.PI);
                const ngb = Scalar.RandomRange(0, Math.PI);
                const strength = Scalar.RandomRange(0.05, 0.2) * 10;
                particle.position.x = 0;
                particle.position.y = 0;
                particle.position.z = 0;

                particle.velocity.x = Math.cos(nga) * Math.cos(ngb) * strength;
                particle.velocity.y = Math.sin(ngb) * strength;
                particle.velocity.z = Math.sin(nga) * Math.cos(ngb) * strength;

                particle.color = new Color4(0, 0, 0, 0);

                const pp = particle as any;
                pp.ttl =  Scalar.RandomRange(300, 1000);
            }
        };

        //Update SPS mesh
        this._SPS.initParticles();
        this._SPS.setParticles();

        this._SPS.updateParticle = (particle: any) => {
            if (particle.ttl - this._time > 0)
            {
                const velocityFactor = Math.pow(0.99, this._time * 0.001);
                (particle.position).copyFrom(particle.velocity.scale(this._time * 0.01));      // update particle new position

                particle.color.r = particle.velocity.x * 0.03;// * velocityFactor;
                particle.color.g = particle.velocity.y * 0.03;// * velocityFactor;
                particle.color.b = particle.velocity.z * 0.03;// * velocityFactor;
                particle.color.a = Math.max((particle.ttl - this._time) / particle.ttl, 0.);
            }
            return particle;
        }

        if (assets.sparksEffect) {
            mesh.material = assets.sparksEffect.clone("sparkles", true);
            mesh.material.backFaceCulling = false;
            mesh.material.alphaMode = Engine.ALPHA_ADD;

            var _this = this;

            this._renderObserver = scene.onBeforeRenderObservable.add(function() {
                if (_this.valid()) {
                    _this._SPS.setParticles();
                }
            });
        }
    }

    public valid(): boolean {
        return this._time >= 0 && this._time < 1000;
    }

    public setPositionOrientation(position: Vector3, orientation: Quaternion): void {
        this._SPS.mesh.position.copyFrom(position);
        this._SPS.mesh.rotationQuaternion?.copyFrom(orientation);
    }

    public setTime(timeMs: number) {
        this._time = timeMs;
    }

    public addDeltaTime(deltaTimeMs: number) {
        this._time += deltaTimeMs;
    }

    public tickEnable(): void {
        this._SPS.mesh.setEnabled(this._time < 1000);
    }

    public getTime(): number {
        return this._time;
    }

    public getPosition(): Vector3 {
        return this._SPS.mesh.position;
    }

    public getOrientation(): Quaternion {
        return this._SPS.mesh.rotationQuaternion ? this._SPS.mesh.rotationQuaternion : Quaternion.Identity();
    }

    public dispose(): void {
        this._scene.onBeforeRenderObservable.remove(this._renderObserver);
        this._SPS.dispose();
    }
}

export class SparksEffects {
    private _shots = new Array<SparksEffect>();

    constructor(scene: Scene, assets: Assets) {
        for(let i = 0; i < MAX_SHOTS; i++) {
            this._shots.push(new SparksEffect(scene, assets, SPARK_COUNT_SHOT));
        }
    }

    public tick(deltaTime: number) {
        this._shots.forEach((effect) => {
            effect.addDeltaTime(deltaTime);
            effect.tickEnable();
        });
    }

    public getSparksEffects(): Array<SparksEffect> {
        return this._shots;
    }

    public addShot(position: Vector3, orientation: Quaternion): void {
        for (let i = 0; i < this._shots.length; i++) {
            const shot = this._shots[i];
            if (!shot.valid()) {
                shot.setPositionOrientation(position, orientation);
                shot.setTime(0);
                return;
            }
        }
    }

    public dispose(): void {
        this._shots.forEach((value) => {
            value.dispose();
        });
    }
}
