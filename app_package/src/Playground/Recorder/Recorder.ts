import { Color3, Quaternion, Vector3, Nullable } from "@babylonjs/core";
import { ShipManager } from "../Ship";
import { ExplosionManager } from "../FX/Explosion"
import { SparksEffects } from "../FX/SparksEffect"
import { Shot, ShotManager, MAX_SHOTS } from "../Shot"
import { MissileManager, Missile } from "../Missile"
import { TrailManager, Trail, TRAIL_LENGTH} from "../FX/Trail"

class PositionOrientationFrame {
    position: Vector3 = new Vector3();
    orientation: Quaternion = new Quaternion();
    enabled: boolean = false;
}

class TimedEffect {
    position: Vector3 = new Vector3();
    orientation: Quaternion = new Quaternion();
    time: number = 0;
}

class Shots {
    shots = Array<Shot>();
    matricesData = new Float32Array(16 * MAX_SHOTS);
}

class TrailData {
    color: Color3 = new Color3();
    alpha: number = 1;
    side: number = 3;
}

class RecordFrame {

    private static _tmpQuaternion = new Quaternion();
    private static _tmpVec3 = new Vector3();

    ships: Array<PositionOrientationFrame> = new Array<PositionOrientationFrame>();
    explosions: Array<TimedEffect> = new Array<TimedEffect>();
    sparks: Array<TimedEffect> = new Array<TimedEffect>();
    missiles: Array<TimedEffect> = new Array<TimedEffect>();
    shots: Shots = new Shots();
    trails: Array<TrailData> = new Array<TrailData>();
    trailData: Nullable<Float32Array> = null;
    trailCurrentIndex: number = 0;
    // [X] ships
    // [X] shots
    // [X] explosion
    // [X] particles
    // [ ] missiles
    // [ ] trails
    public storeFrame(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager): void {
        for(let i = 0; i < shipManager.ships.length; i++){
            const ship = shipManager.ships[i];
            this.ships[i].position.copyFrom(ship.root.position);
            this.ships[i].orientation.copyFrom(ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
            this.ships[i].enabled = !!ship.shipMesh?.isEnabled();
        }

        const explosionArray = explosionManager.getExplosions();
        for(let i = 0; i < explosionArray.length; i++){
            const exp = explosionArray[i];
            this.explosions[i].position.copyFrom(exp.getPosition());
            this.explosions[i].orientation.copyFrom(exp.getOrientation());
            this.explosions[i].time = exp.getTime();
        }

        const sparksArray = sparksEffects.getSparksEffects();
        for(let i = 0; i < sparksArray.length; i++){
            const spa = sparksArray[i];
            this.sparks[i].position.copyFrom(spa.getPosition());
            this.sparks[i].orientation.copyFrom(spa.getOrientation());
            this.sparks[i].time = spa.getTime();
        }

        const missileArray = missileManager.getMissiles();
        for(let i = 0; i < missileArray.length; i++){
            const mis = missileArray[i];
            this.missiles[i].position.copyFrom(mis.getPosition());
            this.missiles[i].orientation.copyFrom(mis.getOrientation());
            this.missiles[i].time = mis.getTime();
        }

        const trailArray = trailManager.getTrails();
        this.trailData = new Float32Array(TRAIL_LENGTH * 4 * trailArray.length);
        this.trailData.set(trailManager.getData());
        this.trailCurrentIndex = trailManager.getCurrentIndex();
        for(let i = 0; i < trailArray.length; i++){
            const trail = trailArray[i];
            this.trails[i].color.copyFrom(trail.getColor());
            this.trails[i].alpha = trail.getAlpha();
            this.trails[i].side = trail.getSide();
        }

        this.shots.matricesData.set(shotManager.getMatrixData());
        this.shots.shots = shotManager.shots.slice(0);
    }

    public restoreFrame(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager,
        trailVisibilityMask: number): void {
        for(let i = 0; i < shipManager.ships.length; i++){
            const ship = shipManager.ships[i];
            ship.root.position.copyFrom(this.ships[i].position);
            if (ship.root.rotationQuaternion) {
                ship.root.rotationQuaternion.copyFrom(this.ships[i].orientation);
            }
            ship.shipMesh?.setEnabled(this.ships[i].enabled);
            if (ship.lastDecal) {
                ship.lastDecal.dispose();
                ship.lastDecal = null;
            }
        }

        const explosionArray = explosionManager.getExplosions();
        for(let i = 0; i < explosionArray.length; i++){
            const exp = explosionArray[i];
            exp.setPositionOrientation(this.explosions[i].position, this.explosions[i].orientation);
            exp.setTime(this.explosions[i].time);
        }

        const sparksArray = sparksEffects.getSparksEffects();
        for(let i = 0; i < sparksArray.length; i++){
            const spa = sparksArray[i];
            spa.setPositionOrientation(this.sparks[i].position, this.sparks[i].orientation);
            spa.setTime(this.sparks[i].time);
        }

        const missileArray = missileManager.getMissiles();
        for(let i = 0; i < missileArray.length; i++){
            const mis = missileArray[i];
            mis.setPositionOrientation(this.missiles[i].position, this.missiles[i].orientation);
            mis.setTime(this.missiles[i].time);
        }

        const trailArray = trailManager.getTrails();
        if (this.trailData) {
            trailManager.getData().set(this.trailData);
        }
        trailManager.setCurrentIndex(this.trailCurrentIndex);
        for(let i = 0; i < trailArray.length; i++){
            const trail = trailArray[i];
            trail.setParameters(this.trails[i].color, this.trails[i].alpha);
            trail.setVisible((this.trails[i].side & trailVisibilityMask) ? true : false);
            trail.update();
        }
        trailManager.update();

        shotManager.getMatrixData().set(this.shots.matricesData);
        shotManager.shots = this.shots.shots.slice(0);
        shotManager.matricesToInstances();
    }

    public restoreFrameBlend(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager,
        nextFrame: RecordFrame,
        trailVisibilityMask: number,
        t: number): void {
        for(let i = 0; i < shipManager.ships.length; i++){
            const ship = shipManager.ships[i];
            Vector3.LerpToRef(this.ships[i].position, nextFrame.ships[i].position, t, ship.root.position);
            if (ship.root.rotationQuaternion) {
                Quaternion.SlerpToRef(this.ships[i].orientation, nextFrame.ships[i].orientation, t, ship.root.rotationQuaternion);
            }
            ship.shipMesh?.setEnabled(this.ships[i].enabled);
            if (ship.lastDecal) {
                ship.lastDecal.dispose();
                ship.lastDecal = null;
            }
        }
        const explosionArray = explosionManager.getExplosions();
        for(let i = 0; i < explosionArray.length; i++){
            const exp = explosionArray[i];
            Vector3.LerpToRef(this.explosions[i].position, nextFrame.explosions[i].position, t, RecordFrame._tmpVec3);
            Quaternion.SlerpToRef(this.explosions[i].orientation, nextFrame.explosions[i].orientation, t, RecordFrame._tmpQuaternion);
            exp.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
            exp.setTime(this.explosions[i].time + (nextFrame.explosions[i].time - this.explosions[i].time) * t);
        }

        const sparksArray = sparksEffects.getSparksEffects();
        for(let i = 0; i < sparksArray.length; i++){
            const spa = sparksArray[i];
            Vector3.LerpToRef(this.sparks[i].position, nextFrame.sparks[i].position, t, RecordFrame._tmpVec3);
            Quaternion.SlerpToRef(this.sparks[i].orientation, nextFrame.sparks[i].orientation, t, RecordFrame._tmpQuaternion);
            spa.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
            spa.setTime(this.sparks[i].time + (nextFrame.sparks[i].time - this.sparks[i].time) * t);
        }

        const missileArray = missileManager.getMissiles();
        for(let i = 0; i < missileArray.length; i++){
            const mis = missileArray[i];
            Vector3.LerpToRef(this.missiles[i].position, nextFrame.missiles[i].position, t, RecordFrame._tmpVec3);
            Quaternion.SlerpToRef(this.missiles[i].orientation, nextFrame.missiles[i].orientation, t, RecordFrame._tmpQuaternion);
            mis.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
            mis.setTime(this.missiles[i].time + (nextFrame.missiles[i].time - this.missiles[i].time) * t);
        }

        const trailArray = trailManager.getTrails();
        if (this.trailData) {
            trailManager.getData().set(this.trailData);
        }
        trailManager.setCurrentIndex(this.trailCurrentIndex);
        for(let i = 0; i < trailArray.length; i++){
            const trail = trailArray[i];
            trail.setParameters(this.trails[i].color, this.trails[i].alpha);
            trail.setVisible((this.trails[i].side & trailVisibilityMask) ? true : false);
            trail.update();
        }
        trailManager.update();

        const dest = shotManager.getMatrixData();
        const A = this.shots.matricesData;
        const B = nextFrame.shots.matricesData;
        for (let i = 0; i < 16 * MAX_SHOTS; i++) {
            dest[i] = A[i] + (B[i] - A[i]) * t;
        }

        shotManager.shots = this.shots.shots.slice(0);
        shotManager.matricesToInstances();
    }

    constructor(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager){
        for(let i = 0; i< shipManager.ships.length; i++){
            this.ships.push(new PositionOrientationFrame());
        }
        for(let i = 0; i< explosionManager.getExplosions().length; i++){
            this.explosions.push(new TimedEffect());
        }
        for(let i = 0; i< sparksEffects.getSparksEffects().length; i++){
            this.sparks.push(new TimedEffect());
        }
        for(let i = 0; i< missileManager.getMissiles().length; i++){
            this.missiles.push(new TimedEffect());
        }
        for(let i = 0; i< trailManager.getTrails().length; i++){
            this.trails.push(new TrailData());
        }
        this.storeFrame(shipManager, explosionManager, sparksEffects, shotManager, missileManager, trailManager);
    }
}

export class Recorder {
    private _recordActive: boolean = false;
    private _shipManager: ShipManager;
    private _explosionManager: ExplosionManager;
    private _sparksEffects: SparksEffects;
    private _missileManager: MissileManager;
    private _trailManager: TrailManager;
    private _shotManager: ShotManager;
    private _availableFrames: number = 0;
    private _maxFrames: number;
    private _head: number = 0;
    private _recordFrames: Array<RecordFrame> = new Array<RecordFrame>();
    private _playbackFrame: number = 0;
    private _playbackSpeed: number = 0;
    private _playingBack: boolean = false;
    private _whenDone: () => void;
    public _trailVisibilityMask: number = 3;
    private _lastFrame: number = -1;

    constructor(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager,
        maxFrames: number) {
        this._shipManager = shipManager;
        this._maxFrames = maxFrames;
        this._explosionManager = explosionManager;
        this._sparksEffects = sparksEffects;
        this._shotManager = shotManager;
        this._missileManager = missileManager;
        this._trailManager = trailManager;
        this._whenDone = () => {};
    }

    public setRecordActive(recordActive: boolean): void {
        this._recordActive = recordActive;
    }

    public getAvailableFrames(): number {
        return this._availableFrames;
    }

    public tick(): void {
        if (!this._recordActive) {
            if (this._playingBack) {
                this._playbackFrame += this._playbackSpeed;
                if (this._playbackFrame >= this._availableFrames) {
                    this._playingBack = false;
                    this._whenDone();
                } else {
                    const effective = this._getEffectiveIndex(Math.floor(this._playbackFrame));
                    if (this._playbackSpeed === 1) {
                        this._recordFrames[effective].restoreFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._trailVisibilityMask);
                    } else {
                        const effectiveN = this._getEffectiveIndex(Math.floor(this._playbackFrame) + 1);
                        const t = this._playbackFrame - Math.floor(this._playbackFrame);
                        this._recordFrames[effective].restoreFrameBlend(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._recordFrames[effectiveN], this._trailVisibilityMask, t);
                    }
                }
            }
            return;
        }

        if (this._recordFrames.length < this._maxFrames) {
            this._recordFrames.push(new RecordFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager));
        } else {
            const frameIndex = this._head % this._maxFrames;
            this._recordFrames[frameIndex].storeFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager);
        }
        this._increaseStore();
    }

    public applyFrame(frameIndex: number): void {
        if (this._recordActive) {
            // issue here
            return;
        }
        this._lastFrame = frameIndex;
        const effective = this._getEffectiveIndex(frameIndex);
        this._recordFrames[effective].restoreFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._trailVisibilityMask);
    }

    public refreshFrame(): void {
        if (this._lastFrame >= 0) {
            this.applyFrame(this._lastFrame);
        }
    }

    public playback(speed: number, whenDone: () => void): void {
        this._playbackFrame = 0;
        this._playbackSpeed = speed;
        this._playingBack = true;
        this._whenDone = whenDone;
    }

    public stop(): void {
        this._playingBack = false;
    }

    public dispose(): void {
    }

    private _getEffectiveIndex(frameIndex: number): number {
        const tail = Math.max(this._head - this._maxFrames, 0) % this._maxFrames;
        const effective = (tail + frameIndex) % this._availableFrames;
        return effective;
    }

    private _increaseStore(): void {
        this._head ++;
        this._availableFrames = Math.min(this._head, this._maxFrames);
    }
}
