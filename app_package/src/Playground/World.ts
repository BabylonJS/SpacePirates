import { Texture, HemisphericLight, Vector3,  Mesh, Scene, Nullable, Color3, Observer, AbstractMesh, Light, LensFlareSystem, LensFlare,  TransformNode, VolumetricLightScatteringPostProcess, Camera, GlowLayer } from "@babylonjs/core";
import { Ship } from "./Ship";
import { Assets} from "./Assets"
import { GameDefinition } from "./Game";
import { PlanetBaker } from "./FX/PlanetBaker";

var seed = 1;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

class Asteroid {
    asteroidRootTransform: TransformNode;
    radius: number = 0;
    position: Vector3 = new Vector3();
    subRadius: Array<number> = new Array<number>()
    subPosition: Array<Vector3> = new Array<Vector3>()
    private _debugSphere: Nullable<AbstractMesh> = null;

    constructor(assets: Assets, scene: Scene, asteroidRadius: number) {
        this.asteroidRootTransform = new TransformNode("AsteroidRoot", scene);
        const asteroidLocationContainer = assets.asteroidLocation;
        if (!asteroidLocationContainer) {
            return;
        }
        const asteroidMeshContainer = assets.asteroidMeshes;
        if (!asteroidMeshContainer) {
            return;
        }

        const scale = 100.0; //Math.random() * 300 + 300
        this.asteroidRootTransform.position.x = random() * asteroidRadius - asteroidRadius * 0.5;
        this.asteroidRootTransform.position.y = random() * asteroidRadius - asteroidRadius * 0.5;
        this.asteroidRootTransform.position.z = random() * asteroidRadius - asteroidRadius * 0.5;

        this.asteroidRootTransform.rotation.x = random() * Math.PI * 2;
        this.asteroidRootTransform.rotation.y = random() * Math.PI * 2;
        this.asteroidRootTransform.rotation.z = random() * Math.PI * 2;

        let asteroidPoints: Vector3[] = [];
        this.asteroidRootTransform.scaling = new Vector3(scale, scale, scale);
        asteroidLocationContainer.transformNodes.forEach((loc) => {
            const locName = loc.name.substring(0,15);
            asteroidMeshContainer.meshes.forEach((msh) => {
                if (msh.name.substring(0, 15) === locName) {
                    const transform = (loc as TransformNode).clone("AsteroidLocation", this.asteroidRootTransform);
                    const subMesh = msh.clone(locName, transform);
                    subMesh?.computeWorldMatrix(true);
                    subMesh?.freezeWorldMatrix();
                    subMesh?.material?.freeze();

                    const subRadius = subMesh?.getBoundingInfo().boundingSphere.radiusWorld;
                    const subPosition = subMesh?.getBoundingInfo().boundingSphere.centerWorld;
                    if (subRadius && subPosition) {
                        this.subRadius.push(subRadius);
                        this.subPosition.push(subPosition);

                        asteroidPoints.push(subPosition);
/*
                        const debugSphere = MeshBuilder.CreateSphere("", {diameter: subRadius}, scene);
                        debugSphere.position.copyFrom(subPosition);
                        debugSphere.visibility = 0.25;*/
                    }
                }
            });
        });

        // compute rough estimation of enclosing sphere
        this.position.set(0, 0, 0);
        asteroidPoints.forEach((p) => {
            this.position.addInPlace(p);
        });
        this.position.divideInPlace(new Vector3().setAll(asteroidPoints.length));
        this.radius = 0;
        asteroidPoints.forEach((p) => {
            this.radius = Math.max(this.radius, Vector3.Distance(this.position, p));
        });

        this.radius *= 4;
/*
        this._debugSphere = MeshBuilder.CreateSphere("", {diameter: this.radius}, scene);
        this._debugSphere.position.copyFrom(this.position);
        this._debugSphere.visibility = 0.25;*/
    }

    public dispose(): void {
        if (this._debugSphere) {
            this._debugSphere.dispose();
        }
        this.asteroidRootTransform.dispose();
    }
}

export class World {
    private _starfield: Nullable<AbstractMesh>;
    private _asteroids: Array<Asteroid> = new Array<Asteroid>();
    private _renderObserver: Nullable<Observer<Scene>> = null;
    private _scene: Scene;
    private _planet: Mesh;
    private _atmosphere: Nullable<AbstractMesh> = null;
    private _tmpVec3: Vector3 = new Vector3();
    private _camera: Camera;
    public ship: Nullable<Ship> = null;
    public sun:VolumetricLightScatteringPostProcess;

    constructor(assets: Assets, scene: Scene, gameDefinition: GameDefinition, camera: Camera, glowLayer: GlowLayer) {
        seed = gameDefinition.seed;

        this._scene = scene;
        this._camera = camera;

        this._starfield = assets.starfield;
        if (this._starfield) {
            this._starfield.parent = null;
        }

        // planet
        this._planet = assets.planetBaker.createPlanet(scene, 1000, glowLayer);
        
        // sun
        this.sun = PlanetBaker.CreateSunPostProcess(camera, scene, assets);
        
        // asteroids
        for (let i = 0; i < gameDefinition.asteroidCount; i++)
        {
            this._asteroids.push(new Asteroid(assets, scene, gameDefinition.asteroidRadius));
        }

        this._renderObserver = scene.onBeforeRenderObservable.add( () => {
            const camera = (scene.activeCameras?.length && scene.activeCameras[0]) ? scene.activeCameras[0]: scene.activeCamera;
            if (camera) {
                const referencePosition = camera.position;
                if (referencePosition) {
                    if (this.ship && this._starfield) {
                        this._starfield.position.copyFrom(referencePosition);
                    }
                    if (this._planet && /*this._sun &&*/ this.ship) {
                        this._planet.position.copyFrom(referencePosition);
                        this._planet.position.z += 2500;

                        World.updateSunPostProcess(referencePosition, this.sun.mesh);
                    }
                }
            }
        });
    }

    public static updateSunPostProcess(referencePosition: Vector3, sunMesh: Mesh) : void {
        sunMesh.position.copyFrom(referencePosition);
        sunMesh.position.x -= 0.47 * 1000;
        sunMesh.position.y -= -0.09 * 1000;
        sunMesh.position.z -= -0.86 * 1000;
    }

    public dispose(): void {
        this.sun.mesh.dispose();
        this.sun.dispose(this._camera);
        this._planet.dispose();
        this._asteroids.forEach((e) => { e.dispose();});
        this._scene.onBeforeRenderObservable.remove(this._renderObserver);
    }

    public collideWithAsteroids(position: Vector3, radius: number): boolean {
        for (let i = 0; i < this._asteroids.length; i++) {
            const asteroid = this._asteroids[i];
            if (!asteroid.asteroidRootTransform) {
                continue;
            }
            const distance = Vector3.Distance(position, asteroid.position);
            
            const delta = distance - radius - asteroid.radius * 0.5;
            if (delta < 0) {
                // finer approximation
                for (let sub = 0; sub < asteroid.subPosition.length; sub ++) {
                    const distanceSub = Vector3.Distance(position, asteroid.subPosition[sub]);
            
                    const deltaSub = distance - radius - asteroid.subRadius[sub] * 0.5;
                    if (deltaSub < 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public shouldAvoid(position: Vector3, radius: number, avoidPos: Vector3): boolean {
        for (let i = 0; i < this._asteroids.length; i++) {
            const asteroid = this._asteroids[i];
            if (!asteroid.asteroidRootTransform) {
                continue;
            }
            const distance = Vector3.Distance(position, asteroid.position);
            
            const delta = distance - radius - asteroid.radius * 2;
            if (delta < 0) {
                position.subtractToRef(asteroid.position, this._tmpVec3);
                this._tmpVec3.normalize();
                this._tmpVec3.scaleInPlace(-delta);
                this._tmpVec3.addInPlace(position);
                avoidPos.copyFrom(this._tmpVec3);
                return true;
            }
        }
        return false;
    }

    public removeAsteroids(position: Vector3, radius: number): void {
        console.log("asteroid count before ", this._asteroids.length);
        for (let i = this._asteroids.length - 1; i >= 0; i--) {
            const asteroid = this._asteroids[i];
            const distance = Vector3.Distance(position, asteroid.position);
            
            const delta = distance - radius - asteroid.radius;
            if (delta < 0) {
                asteroid.dispose();
                this._asteroids.splice(i, 1);
            }
        }
        console.log("asteroid count after ", this._asteroids.length);
    }
}