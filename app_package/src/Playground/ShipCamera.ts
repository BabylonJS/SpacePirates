import { Vector3, Vector4, Scene, FreeCamera, MeshBuilder, StandardMaterial, InstancedMesh, Color3, Matrix } from "@babylonjs/core";
import { Ship } from "./Ship"

export class ShipCamera {

    private _camera: FreeCamera;
    private _ship: Ship;
    private _shakeDelay: number = 0;
    private _shakeVector = new Vector3(0,0,0);

    // burst effect
    private StarCount = 250;
    private StarSpread = 10.0;
    private StarPositions = Array<Vector3>();
    private Stars = Array<InstancedMesh>();

    public getFreeCamera(): FreeCamera {
        return this._camera;
    }

    public isOnScreen(position: Vector3): boolean {
        var spo0 = Vector4.TransformCoordinates(position, this._camera.getViewMatrix());
        var spo1 = Vector4.TransformCoordinates(new Vector3(spo0.x, spo0.y, spo0.z), this._camera.getProjectionMatrix());

        spo1.x /= spo1.w;
        spo1.y /= spo1.w;
        return Math.abs(spo1.x) < 0.5 && Math.abs(spo1.y) < 0.5 && spo1.z > 0;
    }
    
    private _initBurst(scene:Scene): void
    {
        while (this.StarPositions.length < this.StarCount) {
            this.StarPositions.push(
                new Vector3(
                    (Math.random() * 2 - 1) * this.StarSpread * 2,
                    (Math.random() * 2 - 1) * this.StarSpread,
                    (Math.random() * 2 - 1) * this.StarSpread * 10
                )
            )
        }

        var Star = MeshBuilder.CreateCylinder(
            "Star", { height: 30, diameterBottom: 0.05, diameterTop: 0.01, tessellation: 16 }, scene);
        Star.position = new Vector3(100, 100, 100);
        Star.rotation = new Vector3(Math.PI / 2, 0., 0.0);
        var StarMaterial = new StandardMaterial("StarMaterial", scene);
        StarMaterial.diffuseColor = Color3.White();
        StarMaterial.emissiveColor = new Color3(0.5, 0.9, 1);
        StarMaterial.alpha = 0.25;
        Star.material = StarMaterial;

        for (var i = 0; i < this.StarCount; i++) {
            this.Stars.push(Star.createInstance("star" + i));
            this.Stars[i].position = this.StarPositions[i];
            var s = Math.random();
            this.Stars[i].scaling = new Vector3(s, s, s);
            this.Stars[i].parent = this._camera;
        }
    }

    private _tickBurst(bursting:number, gameSpeed: number): void
    {
        const burstStrength = Math.max(bursting - 0.5, 0) * gameSpeed;
        this.Stars.forEach((star:InstancedMesh) => {
            star.position.z -= 1 / 60 * 200 * burstStrength;
            if (star.position.z < -50) star.position.z += 100;
            star.scaling.y = burstStrength + 0.001;
        });
    }
            
    constructor(ship:Ship, scene:Scene)
    {
        this._ship = ship;
        this._camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
        scene.activeCamera = this._camera;

        // burst
        this._initBurst(scene);

        scene.audioListenerPositionProvider = () => {
            if (this._ship && this._ship.transformNode) {
                return this._ship.transformNode.absolutePosition;
            }
            return this._camera.position;
        }
    }

    Tick(ship: Ship, shipWorldMatrix: Matrix, speedRatio:number, gameSpeed: number) {
        this._ship = ship;
        if (this._shakeDelay <= 0)
        {
            this._shakeDelay = 6;
            this._shakeVector.set(Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5);
        }
        this._shakeDelay--;
        const noise = this._shakeVector.clone();
        noise.scaleInPlace(Math.max(ship.bursting, 0) * 0.5 * gameSpeed);

        const localEyePos = new Vector3(0, 
            0.8 + Math.min(ship.bursting, 0) * 0.1, 
            -2.5 - Math.max(ship.bursting, 0) * 1).scale(5);
        localEyePos.addInPlace(noise);
        const eyePos = Vector3.TransformNormal(localEyePos, shipWorldMatrix);

        const localEyeTarget = new Vector3(0,0, 100).scale(5);
        localEyeTarget.addInPlace(noise);
        const eyeTarget = Vector3.TransformNormal(localEyeTarget, shipWorldMatrix);
        const eyeUp = Vector3.TransformNormal(new Vector3(0,1, 0), shipWorldMatrix);
        const shipPos = new Vector3(shipWorldMatrix.m[12], shipWorldMatrix.m[13], shipWorldMatrix.m[14]);

        //camera.setTarget(Vector3.Lerp(camera.getTarget(), eyeTarget.addInPlace(shipPos), 0.2));
        this._camera.upVector = eyeUp;

        var cameraLerp = 0.1 * gameSpeed;// + speedRatio * 0.3;

        ship.localEye = Vector3.Lerp(ship.localEye, eyePos, cameraLerp);
        ship.localTarget = Vector3.Lerp(ship.localTarget, eyeTarget, 0.15 * gameSpeed);
        var tmpTarget = ship.localTarget.clone();
        tmpTarget.addInPlace(shipPos)
        this._camera.fov = 0.8 - ship.bursting * 0.1;

        this._camera.position.set(ship.localEye.x, ship.localEye.y, ship.localEye.z);
        this._camera.position.addInPlace(shipPos);
        this._camera.setTarget(tmpTarget);

        // burst
        this._tickBurst(ship.bursting, gameSpeed);
    }

    dispose() {
        this._camera.dispose();
    }
}