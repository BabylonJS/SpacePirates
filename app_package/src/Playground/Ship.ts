import { Node, Nullable, Vector3, Quaternion, Color3, AbstractMesh, Mesh, MeshBuilder, Vector2, Scene, Matrix, Sound, TransformNode, NodeMaterial, InputBlock, Engine, NodeMaterialBlock, GlowLayer } from "@babylonjs/core";
import { Agent } from "./Agent";
import { Input } from "./Inputs/Input";
import { MissileManager, MISSILE_MAX_LIFE } from "./Missile";
import { MAX_SHOTS, ShotManager } from "./Shot";
import { Assets } from "./Assets";
import { Trail, TrailManager } from "./FX/Trail";
import { SparksEffect, SparksEffects } from "./FX/SparksEffect";
import { ShipCamera } from "./ShipCamera";
import { TextBlock } from "@babylonjs/gui";
import { Parameters } from './Parameters';
import { States } from "./States/States";
import { State } from "./States/State";
import { ExplosionManager } from "./FX/Explosion";
import { World } from "./World";
import { GameDefinition } from "./Game";

enum AIState {
    WANDER = "wander",
    CHASE = "chase",
    EVADE = "evade",
    RETURN = "return",
    AVOID = "Avoid Asteroid",
}

enum ShipManeuver {
    NONE = -1,
    IMMELMANN = 0
}

const factions = [
    {
        trail: {
            color: new Color3(0.64,0.42,0.15)
        }
    },
    {
        trail: {
            color: new Color3(0.12,0.56,0.62)
        }
    }
];

export class Statistics {
    damageDealt: number = 0;
    damageTaken: number = 0;
    shipsDestroyed: number = 0;
    timeOfBattle: number = 0;
    shotFired: number = 0;
    shotHitting: number = 0;
    missilesFired: number = 0;
    static alliesCrash: number = 0;
    static enemiesCrash: number = 0;

    addDamageDealt(): void {
        this.damageDealt ++;
    }

    addDamageTaken(): void {
        this.damageTaken ++;
    }

    addShipDestroyed(): void {
        this.shipsDestroyed ++;
    }

    addTimeOfBattle(time: number): void {
        this.timeOfBattle += time;
    }

    addShotFired(): void {
        this.shotFired ++;
    }

    addShotHitting(): void {
        this.shotHitting ++;
    }

    addMissilesFired(): void {
        this.missilesFired ++;
    }

    static addCrashAlly(): void {
        this.alliesCrash ++;
    }

    static addCrashEnemy(): void {
        this.enemiesCrash ++;
    }
}

export class Ship extends Agent {
    public missileCooldown: number = 0;
    roll: number = 0;
    root: TransformNode;
    velocity: number = 0;
    speedRatio: number = 0;
    trail: Nullable<Trail> = null;
    isHuman: boolean = false;
    faction: number = 0;
    cannonIndex: number = 0;
    localEye: Vector3 =  new Vector3(0,0,0);
    localTarget:Vector3 =  new Vector3(0,0,0);
    shipMesh: Nullable<AbstractMesh> = null;
    cannonR: Nullable<Vector3> = null;
    cannonL: Nullable<Vector3> = null;
    life: number = -1;
    bursting: number = 0;
    bestPrey: number = -1;
    bestPreyTime: number = 0;
    // for debugging purposes (remove later)
    // shows where the ship is trying to fly
    targetSphere: Nullable<Mesh>;
    evadeTimer: number = 0;
    state: AIState = AIState.WANDER;
    dotToEnemy = 0;
    dotToAlly = 0;
    currentThusterPower = 1;
    debugLabel: Nullable<TextBlock> = null;
    evadeTo = Vector3.Zero();
    maneuver = ShipManeuver.NONE;
    maneuverTimer = 0;
    statistics: Nullable<Statistics> = null;
    shipCamera: Nullable<ShipCamera> = null;
    public laserHit: Nullable<Sound> = null;
    public laser: Nullable<Sound[]> = null;
    public missileSfx: Nullable<Sound> = null;
    public explosionSfx: Nullable<Sound[]> = null;
    public shieldMain: Nullable<Mesh> = null;
    private _assets: Assets;
    shieldEffectMaterial: Nullable<NodeMaterial> = null;
    public availableMissiles: number = 0;
    public lastDecal: Nullable<Mesh> = null;
    public lastDecalTime: number = 0;
    public vortexPowerBlocks: InputBlock[] = [];
    public thrusterPowerBlocks: InputBlock[] = [];
    private _glowLayer: GlowLayer;

    constructor(assets: Assets, scene: Scene, glowLayer: GlowLayer)
    {
        super();
        this._assets = assets;
        this.targetSphere = null;
        this._glowLayer = glowLayer;

        this.root = new TransformNode("ShipRoot", scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.shieldEffectMaterial = assets.shieldEffectMaterial;

        if (Parameters.enableAudio) {
            this.laserHit = this._assets.audio?.laserHitSound.clone() as Sound;

            this.missileSfx = this._assets.audio?.missileFireSound.clone() as Sound;
            this.explosionSfx = [this._assets.audio?.explosionSounds[0].clone() as Sound,
                this._assets.audio?.explosionSounds[1].clone() as Sound];
        }
        this.tickEnabled();
    }

    public setThrusterPower(power: number): void {
        this.currentThusterPower = this.currentThusterPower + (power - this.currentThusterPower) * 0.02;
        this.vortexPowerBlocks.forEach((i: InputBlock) => {
            i.value = this.currentThusterPower;
        });
        this.thrusterPowerBlocks.forEach((i: InputBlock) => {
            i.value = this.currentThusterPower;
        });
    }

    public spawn(position: Vector3, quat: Quaternion, isHuman: boolean, faction: number, trailManager: TrailManager, life: number): void {
        this.root.position = position;
        this.root.rotationQuaternion = quat;
        this.quat = quat.clone();
        this.isHuman = isHuman;
        this.faction = faction;
        this.life = life;
        const isValkyrie = !faction;
        var clone;
        if (this._assets.valkyrie && this._assets.raider)
        {
            if (isValkyrie) {
                clone = this._assets.valkyrie.clone("valkyrie", null);
            } else {
                clone = this._assets.raider.clone("raider", null);
            }
        }
        if (clone)
        {
            this.shipMesh = clone;
            this.shipMesh.parent = this.root;
            this.shipMesh.scaling = this.shipMesh.scaling.scale(25);
        } else {
            this.shipMesh = new AbstractMesh("null");
        }

        this.cannonR = isValkyrie ? this._assets.valkyriecannonR : this._assets.raidercannonR;
        this.cannonL = isValkyrie ? this._assets.valkyriecannonL : this._assets.raidercannonL;

        if (isHuman)
        {
            this.statistics = new Statistics;
        }

        this.trail = trailManager.spawnTrail(position, isValkyrie? 1 : 2);
        if (this.trail) {
            this.trail.setParameters(factions[faction].trail.color, 1);
            this.trail.setVisible(!isHuman);
        }
        if (this.laser && this.laserHit) {
            this.laser.forEach((laser: any) => laser.attachToMesh(this.shipMesh!));
            this.laserHit.attachToMesh(this.root);
        }
        if (Parameters.enableAudio) {
            const lasers = isHuman ? this._assets.audio?.heroLaserSounds:this._assets.audio?.raiderLaserSounds;
            if (lasers) {
                this.laser = [lasers[0].clone() as Sound,
                    lasers[1].clone() as Sound,
                    lasers[2].clone() as Sound];
            }
        }

        Ship.HandleThrustersShield(this._assets, this, this.shipMesh, isValkyrie, 0, this._glowLayer);

        this.availableMissiles = isValkyrie ? 8 : 0;
        this.tickEnabled();
    }

    public static HandleThrustersShield(assets: Assets, ship: Nullable<Ship>, shipMesh: AbstractMesh, isValkyrie: boolean, defaultThrusterValue: number, glowLayer: GlowLayer): void {
        let thrusters: TransformNode[] = [];
        shipMesh.getChildTransformNodes(false).forEach((m: TransformNode) => {
            if (m.name.endsWith(isValkyrie?"valkyrieShield_mesh":"raiderShield_mesh")) {
                if (ship) {
                    ship.shieldMain = m as Mesh;
                    ship.shieldMain.parent = null;
                    ship.shieldMain.rotation.set(0, Math.PI, 0);
                    
                    if (isValkyrie) {
                        ship.shieldMain.position.set(0,0.015 * 25 * 1.85, 0);
                        ship.shieldMain.scaling.set(25 * 1.85, 25 * 1.85, 25 * 1.85);
                    } else {
                        ship.shieldMain.position.set(0, -0.009 * 25, 0.02 * 25 * 3.718);
                        ship.shieldMain.scaling.set(25 * 5.451, 25 * 1, 25 * 3.718);
                    }
                    ship.shieldMain.scaling.multiplyInPlace(new Vector3(-1,1,1));
                    ship.shieldMain.setEnabled(false);
                }
            }

            if (m.name.endsWith("valkyrie_thruster_L1") ||
                m.name.endsWith("valkyrie_thruster_L2") ||
                m.name.endsWith("valkyrie_thruster_R1") ||
                m.name.endsWith("valkyrie_thruster_R2") || 
                m.name.endsWith("raider_thruster_L") ||
                m.name.endsWith("raider_thruster_R")) {
                    thrusters.push(m);
                }
        });

        // clone thrusters
        if (ship) {
            ship.vortexPowerBlocks = [];
            ship.thrusterPowerBlocks = [];
        }
        thrusters.forEach((thruster: TransformNode) => {
            let thrusterMesh = assets.thrusterMesh?.clone("thruster", thruster);

            if (assets.thrusterShader && assets.vortexShader)
            {
                const thrusterMat = assets.thrusterShader.clone("thrusterMat_" + thruster.name);
                if (thrusterMat && thrusterMesh) {
                    thrusterMesh.material = thrusterMat;
                    //GLOW LAYER ISSUE
                    //glowLayer.referenceMeshToUseItsOwnMaterial(thrusterMesh);

                    if (thrusterMat) {
                        (thrusterMat.getBlockByName("rand") as InputBlock).value = new Vector2(Math.random(), Math.random());
                        const thrusterPowerBlock = thrusterMat.getBlockByName("power") as InputBlock;
                        thrusterPowerBlock.value = defaultThrusterValue;
                        if (ship) {
                            ship.thrusterPowerBlocks.push(thrusterPowerBlock);
                        }

                        if (isValkyrie) {
                            (thrusterMat.getBlockByName("coreColor") as InputBlock).value = Color3.FromInts(211, 20, 20);
                            (thrusterMat.getBlockByName("midColor") as InputBlock).value = Color3.FromInts(211, 100, 20);
                            (thrusterMat.getBlockByName("sparkColor") as InputBlock).value = Color3.FromInts(216, 168, 48);
                            (thrusterMat.getBlockByName("afterburnerColor") as InputBlock).value = Color3.FromInts(229, 13, 248);
                        } else {
                            (thrusterMat.getBlockByName("coreColor") as InputBlock).value = Color3.FromInts(24, 122, 156);
                            (thrusterMat.getBlockByName("midColor") as InputBlock).value = Color3.FromInts(49, 225, 230);
                            (thrusterMat.getBlockByName("sparkColor") as InputBlock).value = Color3.FromInts(48, 216, 167);
                            (thrusterMat.getBlockByName("afterburnerColor") as InputBlock).value = Color3.FromInts(13, 248, 168);
                        }
                    }
                }
                if (isValkyrie) {
                    let vortexMesh = assets.vortexMesh?.clone("vortex", thruster);
                    const vortexMat = assets.vortexShader?.clone("vortexMat_" + thruster.name);
                    if (vortexMat && vortexMesh) {
                        vortexMesh.material = vortexMat;
                        //GLOW LAYER ISSUE
                        //glowLayer.referenceMeshToUseItsOwnMaterial(vortexMesh);
                        (vortexMat.getBlockByName("rand") as InputBlock).value = new Vector2(Math.random(), Math.random());
                        const vortexPowerBlock = vortexMat.getBlockByName("power") as InputBlock;
                        vortexPowerBlock.value = defaultThrusterValue;
                        if (ship) {
                            ship.vortexPowerBlocks.push(vortexPowerBlock);
                        }
                        if (thruster.name.endsWith("valkyrie_thruster_L1") || thruster.name.endsWith("valkyrie_thruster_L2")) {
                            (vortexMat.getBlockByName("direction") as InputBlock).value = 1;
                        } else {
                            (vortexMat.getBlockByName("direction") as InputBlock).value = -1;
                        }
                    }
                }
            }
        });
    }

    public isValid(): boolean {
        return this.life > 0;
    }

    public tickEnabled(): void {
        this.shipMesh?.setEnabled(this.isValid());
    }

    public fireMissile(missileManager: MissileManager, bestPrey: Ship): Nullable<TransformNode>
    {
        if (!this.shipMesh) {
            return null;
        }
        const missileName = "valkyrie_missileMount"+this.availableMissiles;
        const missileTransform = this.shipMesh.getChildTransformNodes(false, (node: Node) => { return (node as TransformNode).name.endsWith(missileName); })[0];
        if (!missileTransform) {
            return null;
        }
        const worldPosition = new Vector3;
        const worldOrientation = new Quaternion;
        missileTransform.computeWorldMatrix(true);
        missileTransform.getWorldMatrix().decompose(undefined, worldOrientation, worldPosition);
        missileTransform.parent = null;
        
        missileTransform.getChildMeshes()[0].position.scaleInPlace(25)
        missileTransform.getChildMeshes()[0].rotationQuaternion = null;
        missileTransform.getChildMeshes()[0].rotation.setAll(0);
        missileTransform.getChildMeshes()[0].scaling = new Vector3(25, 25, 25);
        missileTransform.position = worldPosition;
        missileTransform.scaling.setAll(1);
        missileTransform.rotation.setAll(0);
        missileTransform.rotationQuaternion = worldOrientation;
        
        missileManager.fireMissile(worldPosition, worldOrientation, bestPrey, this, missileTransform);
        this.availableMissiles --;
        return missileTransform;
    }

    dispose() {
        this.root.dispose();
        this.shipMesh?.dispose();
        if (this.trail) {
            this.trail.dispose();
        }
        if (this.targetSphere) {
            this.targetSphere.dispose();
        }
        if (this.debugLabel) {
            this.debugLabel.dispose();
        }
        if (Parameters.enableAudio) {
            this.laserHit?.dispose();
            this.laser?.forEach((laser: Sound) => laser.dispose());
            this.missileSfx?.dispose();
            this.explosionSfx?.forEach((explosion: Sound) => explosion.dispose());
        }
        if (this.shipCamera) {
            this.shipCamera.dispose();
        }
    }
}

export class ShipManager {
    ships = new Array<Ship>();
    private _gameDefinition: GameDefinition;
    shipIndexToFollow = 0;
    _missileManager: MissileManager;
    _shotManager: ShotManager;
    private _trailManager: TrailManager;
    time: number = 0;
    _scene: Scene;
    private _tmpVec3 = new Vector3(0,0,0);
    private _assets: Assets;
    private _tempMatrix = new Matrix();
    private _avoidPos = new Vector3();
    private static _tmpMatrix = new Matrix;
    //private _glowLayer: GlowLayer;

    constructor(missileManager: MissileManager, shotManager: ShotManager, assets:Assets, trailManager: TrailManager, scene: Scene, maxShips: number, gameDefinition: GameDefinition, glowLayer: GlowLayer) {
        this._gameDefinition = gameDefinition;
        this._missileManager = missileManager;
        this._shotManager = shotManager;
        this._scene = scene;
        this._assets = assets;
        this._trailManager = trailManager;
        //this._glowLayer = glowLayer;

        for (let i =0; i < maxShips; i++)
        {
            this.ships.push(new Ship(this._assets, this._scene, glowLayer));
        }

        Statistics.alliesCrash = 0;
        Statistics.enemiesCrash = 0;
    }

    spawnShip(position: Vector3, quat: Quaternion, isHuman: boolean, faction: number): Nullable<Ship> {
        for (let i = 0; i < this.ships.length; i++) {
            if (!this.ships[i].isValid()) {
                const ship = this.ships[i];
                const life = isHuman ? (faction ? this._gameDefinition.humanEnemiesLife : this._gameDefinition.humanAlliesLife) : 
                    (faction ? this._gameDefinition.aiEnemiesLife : this._gameDefinition.aiAlliesLife);
                ship.spawn(position, quat, isHuman, faction, this._trailManager, life);
                return ship;
            }
        }
        // fatal error
        return null;
    }

    destroyShip(shipIndex: number) {
        console.log(`destroying ${shipIndex}`)
        const ship = this.ships[shipIndex];
        this._shotManager.shots.forEach(shot => {
            if (shot.firedBy === ship) {
                shot.firedBy = undefined;
            }
        });
        ship.trail?.invalidate();
        ship.shipMesh?.setEnabled(false);
        ship.bursting = 0;

        this.ships.forEach(otherShip => {
            if (otherShip.isValid() && otherShip.bestPrey == shipIndex) {
                otherShip.bestPrey = -1;
                otherShip.bestPreyTime = 0;
            }
        })
    }

    findBestPreyFor(index: number) {
        const ships = this.ships;
        const ship = ships[index];
        let bestToChase = -1; 
        let bestDot = Parameters.AIPerceptionCone
        ship.dotToEnemy = Parameters.AIPerceptionCone;
        ship.dotToAlly = Parameters.AIPerceptionCone;
        for (let other = 0; other < ships.length; other++) {
            if (!ships[other].isValid()) {
                continue;
            }
            if (ship.shipCamera) {
                const onScreen = ship.shipCamera.isOnScreen(ships[other].root.position);
                if (!onScreen) {
                    continue;
                }
            }
            if (other != index) {
                const dot = ShipManager.dotToTarget(ship, ships[other].root.position)
                if (ship.faction != ships[other].faction && dot > ship.dotToEnemy /*&& chaseDot < 0.997*/) {
                    if ((ship.isHuman || this.howManyTargeting(other) <= Parameters.AIMaxTargets) && dot > bestDot) {
                        bestDot = dot;
                        bestToChase = other;
                    }
                    bestToChase = other;
                    ship.dotToEnemy = dot;
                } else if (ship.faction == ships[other].faction && dot > ship.dotToAlly) {
                    ship.dotToAlly = dot;
                }
            }
        }
        return bestToChase;
    }

    // tells you whether ship is aiming towards position
    // 1.0 = exactly facing shipB
    // -1.0 = facing away from shipB
    // 0.0 = perpendicular
    public static dotToTarget(ship : Ship, position: Vector3) {
        const chaseDir = position.subtract(ship.root.position);
        chaseDir.normalize();
        return Vector3.Dot(ship.forward, chaseDir);
    }

    howManyTargeting(targetIndex: number) {
        let count = 0;
        this.ships.forEach((ship, index) => {
            if (!ship.isHuman && index != targetIndex && ship.bestPrey == targetIndex) count++;
        })
        return count;
    }
 
    public tick(canShoot: boolean, humanInputs: Input, deltaTime: number, gameSpeed: number, sparksEffects: SparksEffects, explosionManager: ExplosionManager, world: World, targetGameSpeed: number): void {
        if (gameSpeed <= 0.001) {
            return;
        }

        this.time += deltaTime;
        
        const ships = this.ships;
        for (var index = 0;index < ships.length; index++) {
            const ship = ships[index];

            ship.lastDecalTime -= deltaTime;
            if (ship.lastDecalTime < 0 && ship.lastDecal)
            {
                ship.lastDecal.material?.dispose();
                ship.lastDecal.dispose();
                ship.lastDecal = null;
            }
            
            ship.tickEnabled();
            if (!ship.isValid()) {
                continue;
            }
            const input = ship.isHuman ? humanInputs : ship.input;

            ship.statistics?.addTimeOfBattle(deltaTime);

            if (!ship.isHuman) {
                this._tickAI(ship, deltaTime, index, world);
            } else {
                this._tickHuman(ship, deltaTime, index);
            }

            this._tickGeneric(ship, input, deltaTime, gameSpeed, canShoot, targetGameSpeed);
            this._tickShipVsShots(ship, input, sparksEffects, explosionManager);
            this._tickShipVsMissile(ship, sparksEffects, explosionManager);

            if (ship.isHuman) {
                if (ship.missileCooldown <= 0) {
                    const bestToChase = this.findBestPreyFor(index);
                    if (bestToChase == ship.bestPrey) {
                        ship.bestPreyTime += deltaTime;
                    } else {
                        ship.bestPreyTime = 0;
                    }
                    ship.bestPrey = bestToChase;
                } else {
                    ship.bestPrey = -1;
                    ship.bestPreyTime = 0;
                }
            }

            if (ship.isHuman) {
                if (this._assets.audio && this._assets.audio.thrusterSound.isReady()) {
                    this._assets.audio.thrusterSound.setVolume(Math.max(0, ship.bursting / 2));
                }
            }
            this._tickAsteroids(ship, world, explosionManager);
            this._tickEndOfLife(ship, index);
        }
    }

    private _tickAsteroids(ship: Ship, world: World, explosionManager: ExplosionManager): void {
        if (world.collideWithAsteroids(ship.root.position, 1.0)) {
            ship.life = -1;
            explosionManager.spawnExplosion(ship.root.position.clone(), ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
            if (ship.faction) {
                Statistics.addCrashEnemy();
            } else {
                Statistics.addCrashAlly();
            }
        }
    }

    private _tickEndOfLife(ship: Ship, index: number): void {
        if (ship.life <= 0) {
            this._missileManager.invalidateMissileChasing(ship);
            if (ship.explosionSfx) {
                const rand = Math.floor(Math.random() * ship.explosionSfx.length);
                ship.explosionSfx[rand].setPosition(ship.position);
                ship.explosionSfx[rand].play();
            }
            if (ship.isHuman)
            {
                States.dead.ship = ship;
            }
            this.destroyShip(index);
        }
    }

    private _tickGeneric(ship: Ship, input: Input, deltaTime: number, gameSpeed: number, canShoot: boolean, targetGameSpeed: number): void {
        var wmat = ship.root.getWorldMatrix();
        const forward = new Vector3(wmat.m[8], wmat.m[9], wmat.m[10]);
        const right = new Vector3(wmat.m[0], wmat.m[1], wmat.m[2]);
        const up = new Vector3(wmat.m[4], wmat.m[5], wmat.m[6]);
        ship.forward = forward;
        ship.up = up;
        ship.right = right;

        if (ship.maneuver == ShipManeuver.NONE) {
            if (input.immelmann) {
                ship.maneuver = ShipManeuver.IMMELMANN;
                ship.maneuverTimer = Parameters.ImmelmannDuration;
            }
        } else {
            if (ship.maneuver == ShipManeuver.IMMELMANN) {
                input.dx = 0;
                if (ship.maneuverTimer >= 600) {
                    input.dy -= 0.12;
                } else {
                    input.dy = 0;
                }
            }
            ship.maneuverTimer -= deltaTime;
            if (ship.maneuverTimer <= 0) {
                ship.maneuver = ShipManeuver.NONE;
            }
        }

        // restraint movement when in burst mode
        const constrainFactor = Math.min(1.1 - ship.bursting * 0.5, 1.) * gameSpeed;
        input.dx *= constrainFactor;
        input.dy *= constrainFactor;

        // orientation
        ship.roll = ship.roll + (input.dx - ship.roll) * 0.01 * gameSpeed;
        if (ship.maneuver == ShipManeuver.IMMELMANN) {
            // do a barel roll
            if (ship.maneuverTimer < 600) {
                ship.roll = Math.sin((ship.maneuverTimer / 600) * Math.PI * 0.5) * 0.2;
            }
        }

        const rx = Quaternion.RotationAxis(new Vector3(0,1,0), input.dx);
        const mat = this._tempMatrix;
        rx.toRotationMatrix(mat);
        const ry = Quaternion.RotationAxis(new Vector3(mat.m[0], mat.m[1], mat.m[2]), input.dy);

        ship.quat = ship.quat.multiply(rx).multiply(ry);
        ship.quat.normalize();

        ship.root.rotationQuaternion = Quaternion.Slerp(ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity(), ship.quat, 0.05);
        //ship.roll *= 0.9;

        if (ship.shipMesh) {
            ship.shipMesh.rotationQuaternion = null;
            ship.shipMesh.rotation.z = ship.roll * 30;
            ship.shipMesh.rotation.y = Math.PI;
        }

        // position
        //ship.velocity = this.maxSpeed; // always moving
        ship.speedRatio = Math.min(ship.velocity / Parameters.maxSpeed, 1.);
        if (ship.isHuman) {
            ship.setThrusterPower(input.burst ? 2 : (input.breaking ? 0 : 1));
        } else {
            ship.setThrusterPower(ship.faction ? 2 : 1);
        }

        //console.log(ship.speedRatio);
        if (true) // TODO humanInputs[1])
        {
            if (input.burst) {
                let currentAccel = Parameters.maxAccel * (1.0 - ship.speedRatio);
                ship.velocity += currentAccel * 8;
            } else if (input.breaking) {
                ship.velocity *= 0.98;
            } else {
                let currentAccel = Parameters.maxAccel * (0.5 - ship.speedRatio);
                ship.velocity += currentAccel * 8;
            }
        }

        ship.root.position.addInPlace(forward.scale(ship.velocity * gameSpeed));

        // damping
        //ship.velocity *= 0.99;

        // trail
        if (ship.trail && targetGameSpeed ===1) {
            ship.trail.append(ship.root.position);
            /*if (ship.isHuman) {
                const dest = ship.box.position.clone();
                dest.addInPlace(new Vector3(0,0,100));
                this._sparksEffect.CreateShot(dest, new Vector3(0,1,0), 1);
            }*/
            ship.trail.setVisible(!ship.isHuman);
        }

        // reset for next frame
        input.dx = 0;
        input.dy = 0;

        if (canShoot && input.shooting && deltaTime > 0.001) {
            this._shotManager.addShot(ship, wmat, ship.isHuman, ship.cannonIndex);
            ship.statistics?.addShotFired();
            ship.cannonIndex = (ship.cannonIndex + 1)&1;
            if (ship.laser) {
                const rand = Math.floor(Math.random() * ship.laser.length);
                ship.laser[rand].play();
            }
        }

        ship.missileCooldown = Math.max(ship.missileCooldown - deltaTime, 0);

        if (ship.bestPrey >= 0 && ship.bestPreyTime > Parameters.timeToLockMissile && input.launchMissile && ship.missileCooldown <= 0) {
            if (this._assets.trailMaterial && ship.availableMissiles) {
                const missile = ship.fireMissile(this._missileManager, this.ships[ship.bestPrey]);
                ship.statistics?.addMissilesFired();
                if (missile && ship.missileSfx) {
                    ship.missileSfx.attachToMesh(missile!);
                    ship.missileSfx.play();
                }
            }
            ship.missileCooldown = Parameters.missileCoolDownTime;
        }

        if (input.breaking) {
            ship.bursting = Math.max(ship.bursting - deltaTime * 0.001, -2.);
        } else if (input.burst) {
            ship.bursting = Math.min(ship.bursting + deltaTime * 0.001, 2.);
        } else {
            ship.bursting *= 0.98;
        }
    }

    private _tickShipVsMissile(ship: Ship, sparksEffects: SparksEffects, explosionManager: ExplosionManager) {
        // missile / ship
        for (let p = 0; p < this._missileManager.missiles.length; p++) {
            const missile = this._missileManager.missiles[p];
            if (!missile.isValid()) {
                continue;
            }
            if (missile.shipToChase == ship) {
                const dist = Vector3.DistanceSquared(missile.getPosition(), ship.root.position);
                if (dist < 200) {
                    ship.life -= this._gameDefinition.missileDamage;
                    ship.statistics?.addDamageTaken();
                    missile.setTime(MISSILE_MAX_LIFE + 1);
                    // Ship died to missile
                    if (ship.life <= 0) {
                        explosionManager.spawnExplosion(ship.root.position.clone(), ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
                        missile.firedBy?.statistics?.addShipDestroyed();
                    }
                }
            }
        }
    }

    private _tickShipVsShots(ship: Ship, input: Input, sparksEffects: SparksEffects, explosionManager: ExplosionManager): void {
        const ships = this.ships;

        // shot / ship
        var tmpPewpewPos = new Vector3();
        var pewpews = this._shotManager.shots;
        const matrices = this._shotManager.getMatrices();
        for (let p = 0; p < MAX_SHOTS; p++) {
            if (pewpews[p].ttl > 0 && pewpews[p].firedBy != ship) {
                tmpPewpewPos.set(matrices[p*16 + 12], matrices[p*16 + 13], matrices[p*16 + 14]);
                const dist = Vector3.DistanceSquared(ship.root.position, tmpPewpewPos);
                if (dist <= 36) {
                    sparksEffects.addShot(ship.root.position, ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
                    // shield effect
                    if (ship.shieldEffectMaterial && ship.shieldMain) {
                        if (ship.lastDecal)
                        {
                            ship.lastDecal.material?.dispose();
                            ship.lastDecal.dispose();
                        }
                        var normal = tmpPewpewPos.subtract(ship.root.position).normalize();

                        ship.root.getWorldMatrix().invertToRef(ShipManager._tmpMatrix);
                        const localNormal = Vector3.TransformNormal(normal, ShipManager._tmpMatrix);
                        
                        var decalSize = new Vector3(7,7,7);
                        ship.lastDecal = MeshBuilder.CreateDecal("decal", ship.shieldMain, {position: Vector3.Zero(), normal: localNormal, size: decalSize});
                        ship.lastDecalTime = 475;
                        ship.lastDecal.parent = ship.root;
                        let nodeMat = ship.shieldEffectMaterial.clone("shieldEffectMat");
                        nodeMat.alphaMode = Engine.ALPHA_ADD;
                        if (ship.faction) {
                            (nodeMat.getBlockByName("hitColor") as any).value = new Color3(0.42, 3.27, 3.72);
                            (nodeMat.getBlockByName("valkyriePattern") as any).value = 0.0;
                        } else {
                            (nodeMat.getBlockByName("hitColor") as any).value = new Color3(3.01, 1.72, 0.30);
                            (nodeMat.getBlockByName("valkyriePattern") as any).value = 1.0;
                        }
                        ship.lastDecal.material = nodeMat;
                        (nodeMat.getBlockByName("startTime") as InputBlock).value = (nodeMat.getBlockByName("Time") as InputBlock).value;
                    }

                    pewpews[p].ttl = -1;
                    pewpews[p].firedBy?.statistics?.addDamageDealt();
                    pewpews[p].firedBy?.statistics?.addShotHitting();
                    ship.statistics?.addDamageTaken();
                    ship.life -= this._gameDefinition.shotDamage;
                    if (!ship.isHuman) {
                        ship.evadeTimer = Parameters.AIEvadeTime;
                        const hitVector = tmpPewpewPos.subtract(ship.root.position);
                        const evadeDirection = hitVector.normalize();
                        ship.evadeTo = ship.root.position.clone().addInPlace(evadeDirection.cross(ship.forward).multiplyByFloats(1000,1000,1000));
                        if (pewpews[p].firedBy && pewpews[p].firedBy!.faction !== ship.faction) {
                            ship.bestPrey = ships.indexOf(pewpews[p].firedBy!);
                        }
                        if (Math.random() < Parameters.AIImmelmannProbability) {
                            input.immelmann = true;
                        }
                    }
                    // Ship died to lasers
                    if (ship.life <= 0) {
                        explosionManager.spawnExplosion(ship.root.position, ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
                        pewpews[p].firedBy?.statistics?.addShipDestroyed();
                    } else {
                        if (ship.laserHit) {
                            ship.laserHit.play();
                        }
                    }
                }
            }
        }
    }

    private _tickHuman(ship: Ship, localTime: number, index: number): void {
        // clamp player inside playable bounding sphere
        const centerToShip = this._tmpVec3;
        centerToShip.copyFrom(ship.root.position);
        const distance = centerToShip.length();
        centerToShip.normalize();
        ship.root.position.copyFrom(centerToShip.scale(Math.min(distance, this._gameDefinition.humanBoundaryRadius)));
    }

    private _tickAI(ship: Ship, localTime: number, index: number, world: World): void {
        const input = ship.input;
        const ships = this.ships;

        // too far from center?
        if (world.shouldAvoid(ship.root.position, 1, this._avoidPos)) {
            ship.state = AIState.AVOID;
        } else if (ship.root.position.length() > this._gameDefinition.enemyBoundaryRadius) {
            ship.state = AIState.RETURN
        } else {
            if (ship.evadeTimer > 0) {
                ship.evadeTimer -= localTime;
                ship.state = AIState.EVADE;
            } else {
                const bestPreyNow = this.findBestPreyFor(index);
                // if we have a target, and we can see them, stay on them
                if (bestPreyNow != ship.bestPrey) {
                    ship.bestPreyTime = 0;
                    ship.bestPrey = bestPreyNow;
                } else {
                    ship.bestPreyTime += localTime;
                }
                if (ship.bestPrey >= 0)
                {
                    ship.state = AIState.CHASE;
                } else {
                    // wander around
                    ship.state = AIState.WANDER;
                }
            }
        }
        // HANDLE BEHAVIOR
        // by default, do nothing
        input.burst = false;
        input.breaking = false;
        input.shooting = false;
        input.immelmann = false;
        switch (ship.state) {
            case AIState.AVOID:
                ship.goToward(this._avoidPos, ship.root.position, 0.02);
                break;
            case AIState.RETURN:
                ship.goToward(Vector3.Zero(), ship.root.position, 0.02);
                break;
            case AIState.EVADE:
                input.burst = true;
                ship.goToward(ship.evadeTo,ship.root.position, Parameters.AITurnRate);
                break;
            case AIState.CHASE:
                const enemy = ships[ship.bestPrey].root;
                // position to aim the ship towards
                const gotoPos = enemy.position.add(enemy.forward.normalizeToNew().multiplyByFloats(Parameters.AIFollowDistance,Parameters.AIFollowDistance,Parameters.AIFollowDistance));
                // const aimWmat = enemy.getWorldMatrix();
                // aimPos.addInPlace((new Vector3(aimWmat.m[8], aimWmat.m[9], aimWmat.m[10])).scale(100));
                if (ship.targetSphere) {
                    ship.targetSphere.position = gotoPos;
                }
                ship.goToward(gotoPos, ship.root.position, Parameters.AITurnRate);
                // position we want to fire at - where we predict the enemy will be in the future
                const firePos = enemy.position.add(enemy.forward.normalizeToNew().multiplyByFloats(Parameters.AIPredictionRange * ships[ship.bestPrey].velocity,Parameters.AIPredictionRange * ships[ship.bestPrey].velocity,Parameters.AIPredictionRange * ships[ship.bestPrey].velocity));
                const fireDot = ShipManager.dotToTarget(ship, firePos)
                const distanceToTarget = ship.root.position.subtract(enemy.position).length();
                if ((distanceToTarget < Parameters.AIBreakDistance || ship.dotToEnemy < 0.4) && ship.velocity > Parameters.AIMinimumSpeed) {
                    input.breaking = true;
                }
                if (distanceToTarget > Parameters.AIBurstDistance && ship.dotToEnemy > 0.8 && ship.velocity < Parameters.AIMaximumSpeed) {
                    input.burst = true;
                }
                if (fireDot > Parameters.AIFirePrecision && ship.dotToAlly < Parameters.AIFriendlyFirePrecision && distanceToTarget < Parameters.AIFireRange) {
                    input.shooting = true;
                }

                break;
            case AIState.WANDER:
                input.dx = Math.cos(this.time * 0.002) * Parameters.AITurnRate;
                input.dy = Math.sin(this.time * 0.002) * Parameters.AITurnRate;
                break;
        }
        // add a bit of randomness
        input.dx += (2 * Math.random() - 1) * Parameters.AIInputRandomness;
        input.dy += (2 * Math.random() - 1) * Parameters.AIInputRandomness;
    }

    public dispose(): void {
        this.ships.forEach(ship => {
            ship.dispose();
        });
        this._missileManager.dispose();
        this._shotManager.dispose();
    }
}