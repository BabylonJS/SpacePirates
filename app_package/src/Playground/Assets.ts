import { ContainerAssetTask, TransformNode, AbstractMesh, Tools, Scene, TextFileAssetTask, MeshAssetTask, Nullable, NodeMaterial, Texture, NodeMaterialBlock, TextureBlock, Vector3, CubeTexture, Sound, AssetContainer, Color3, InputBlock, AssetsManager } from "@babylonjs/core";
import { useNative } from "..";
import { PlanetBaker } from "./FX/PlanetBaker";
import { Parameters } from "./Parameters";

declare var _native : any;
declare var Canvas : any;
declare var _CanvasImpl : any;

export class Assets {
    public raider: Nullable<AbstractMesh> = null;
    public valkyrie: Nullable<AbstractMesh> = null;
    public trailMaterial: Nullable<NodeMaterial> = null;
    public starfieldMaterial: Nullable<NodeMaterial> = null;
    public sunTexture: Nullable<Texture> = null;
    public starfieldTextureBlock: Nullable<NodeMaterialBlock> = null;
    public planetMaterial: Nullable<NodeMaterial> = null;
    public sparksEffect: Nullable<NodeMaterial> = null;
    public asteroidsTriPlanar: Nullable<NodeMaterial> = null;

    public explosionMaterial: Nullable<NodeMaterial> = null;
    public explosionMesh: Nullable<AbstractMesh> = null;

    public thrusterMesh: Nullable<AbstractMesh> = null;
    public vortexMesh: Nullable<AbstractMesh> = null;

    public noisyRockMaterial: Nullable<NodeMaterial> = null;
    public projectileShader: Nullable<NodeMaterial> = null;

    public thrusterShader: Nullable<NodeMaterial> = null;
    public vortexShader: Nullable<NodeMaterial> = null;
    
    public asteroidMeshes: Nullable<AssetContainer> = null;
    public asteroidLocation: Nullable<AssetContainer> = null;
    public starfield: Nullable<AbstractMesh> = null;
    
    public raidercannonL: Nullable<Vector3> = null;
    public raidercannonR: Nullable<Vector3> = null;

    public valkyriecannonL: Nullable<Vector3> = null;
    public valkyriecannonR: Nullable<Vector3> = null;

    public audio: Nullable<AudioAssets> = null;
    public assetsHostUrl: string;
    public static missions: any;

    public envCube: CubeTexture;

    public planetBaker: PlanetBaker;
    public shieldEffectMaterial: Nullable<NodeMaterial> = null;
    public projectile: Nullable<AbstractMesh> = null;

    public static loadingComplete: boolean = false;

    constructor(scene:Scene, assetsHostUrl: string, whenReady: (assets:Assets) => void, whenLoadingComplete: (assets:Assets) => void)
    {
            var _this = this;
            this.assetsHostUrl = assetsHostUrl;
            
            // add in IBL with linked environment
            this.envCube = CubeTexture.CreateFromPrefilteredData(assetsHostUrl + "/assets/env/environment.env", scene);
            this.envCube.name = "environment";
            this.envCube.gammaSpace = false;
            this.envCube.rotationY = 1.977;

            this.planetBaker = new PlanetBaker(scene, assetsHostUrl, 512);

            scene.environmentTexture = this.envCube;
            scene.environmentIntensity = 1.25;

            // MINIMAL loading
            var assetsManagerMinimal = new AssetsManager(scene);
            var valkyrieTask = assetsManagerMinimal.addMeshTask("valkyrieTask", "", assetsHostUrl + "/assets/gltf/", "valkyrie_mesh.glb");
            valkyrieTask.onSuccess = function (task: MeshAssetTask) {
                _this.valkyrie = task.loadedMeshes[0];
                _this.valkyrie.getChildTransformNodes().forEach((m: TransformNode) => {
                    if (m.name == "valkyrie_cannon_L") 
                        _this.valkyriecannonL = m.absolutePosition.clone();
                    else if (m.name == "valkyrie_cannon_R")
                        _this.valkyriecannonR = m.absolutePosition.clone();
                });
            };

            var starsGeoTask = assetsManagerMinimal.addMeshTask("starsGeoTask", "", assetsHostUrl + "/assets/gltf/", "starsGeo.glb");
            starsGeoTask.onSuccess = function (task: MeshAssetTask) {
                _this.starfield = task.loadedMeshes[1];
                if (_this.starfield) {
                    _this.starfield.scaling = new Vector3(4500,4500,4500);
                    _this.starfield.visibility = 0;
                }
            };

            var thrusterTask = assetsManagerMinimal.addMeshTask("thrusterTask", "", assetsHostUrl + "/assets/gltf/", "thrusterFlame_mesh.glb");
            thrusterTask.onSuccess = function (task: MeshAssetTask) {
                _this.thrusterMesh = task.loadedMeshes[1];
            };

            var vortexTask = assetsManagerMinimal.addMeshTask("vortexTask", "", assetsHostUrl + "/assets/gltf/", "vortex_mesh.glb");
            vortexTask.onSuccess = function (task: MeshAssetTask) {
                _this.vortexMesh = task.loadedMeshes[1];
            };

            assetsManagerMinimal.onTasksDoneObservable.add(() => {

                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/thrusterFlame.json", scene).then((nodeMaterial) => {
                    _this.thrusterShader = nodeMaterial.clone("thrusterMaterial", true);
                    _this.thrusterShader.backFaceCulling = false;
                    _this.thrusterShader.alphaMode = 1;
                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/vortex.json", scene).then((nodeMaterial) => {
                        _this.vortexShader = nodeMaterial.clone("vortexMaterial", true);
                        _this.vortexShader.backFaceCulling = false;
                        _this.vortexShader.alphaMode = 1;

                        const starfieldShaderName = Parameters.starfieldHeavyShader ? "/assets/shaders/starfieldShaderHeavy.json" : "/assets/shaders/starfieldShader.json";
                        NodeMaterial.ParseFromFileAsync("", assetsHostUrl + starfieldShaderName, scene).then((nodeMaterial) => {
                            //nodeMaterial.build(false);
                            if (_this.starfield) {
                                const starfieldTexture = new Texture(assetsHostUrl + "/assets/textures/starfield_panorama_texture_mini.jpg", scene, false, false);
                                if(nodeMaterial.getBlockByName("emissiveTex")) {
                                    _this.starfieldTextureBlock = nodeMaterial.getBlockByName("emissiveTex");
                                    (_this.starfieldTextureBlock as TextureBlock).texture = starfieldTexture;
                                }
                                _this.starfield.material = nodeMaterial;
                            }
                            _this.starfieldMaterial = nodeMaterial; 
                            console.log("Minimal asset loading done");
                            if (useNative) {
                                Tools.LoadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf", true).then((data) => { 
                                    _native.Canvas.loadTTFAsync("Arial", data); 
                                    whenReady(_this);
                                });
                            } else {
                                whenReady(_this);
                            }
                            // minimal done
                            this._completeLoading(scene, assetsHostUrl, whenLoadingComplete);
                        });
                    });
                });
                
            });
            assetsManagerMinimal.load();
    }

    private _completeLoading(scene: Scene, assetsHostUrl: string, whenLoadingComplete: (assets:Assets) => void): void {
        // COMPLETE loading
        var _this = this;
        var assetsManager = new AssetsManager(scene);
        var raiderTask = assetsManager.addMeshTask("raiderTask", "", assetsHostUrl + "/assets/gltf/", "raider_mesh.glb");
        raiderTask.onSuccess = function (task: MeshAssetTask) {
            _this.raider = task.loadedMeshes[0];
            _this.raider.getChildTransformNodes().forEach((m: TransformNode) => {
                if (m.name == "raider_cannon_L")
                    _this.raidercannonL = m.absolutePosition.clone();
                else if (m.name == "raider_cannon_R")
                    _this.raidercannonR = m.absolutePosition.clone();
            });
        };

        var explosionMeshTask = assetsManager.addMeshTask("explosionMeshTask", "", assetsHostUrl + "/assets/gltf/", "explosionSpheres_mesh.glb");
        explosionMeshTask.onSuccess = function (task: MeshAssetTask) {
            _this.explosionMesh = task.loadedMeshes[1];
            _this.explosionMesh.parent = null;
            _this.explosionMesh.material?.dispose();
        };
        var asteroidsTask = assetsManager.addContainerTask("asteroidsTask", "", assetsHostUrl + "/assets/gltf/", "asteroids_meshes.glb");
        asteroidsTask.onSuccess = function (task: ContainerAssetTask) {
            _this.asteroidMeshes = task.loadedContainer;
        };
        var asteroidsTask = assetsManager.addContainerTask("asteroidsTask", "", assetsHostUrl + "/assets/gltf/", "asteroid_V1.glb");
        asteroidsTask.onSuccess = function (task: ContainerAssetTask) {
            _this.asteroidLocation = task.loadedContainer;
        };

        var projectileTask = assetsManager.addMeshTask("projectileTask", "", assetsHostUrl + "/assets/gltf/", "projectile_mesh.glb");
        projectileTask.onSuccess = function (task: MeshAssetTask) {
            _this.projectile = task.loadedMeshes[1];
            _this.projectile.scaling = new Vector3(100,100,100);
            
            (_this.projectile as any).bakeTransformIntoVertices(_this.projectile.computeWorldMatrix(true));
            _this.projectile.setEnabled(false);
        };
        var missionsTask = assetsManager.addTextFileTask("missionsTask", assetsHostUrl + "/assets/missions.json");
        missionsTask.onSuccess = function (task: TextFileAssetTask) {
            Assets.missions = JSON.parse(task.text);
        };

        this.sunTexture = new Texture(assetsHostUrl + "/assets/textures/sun.png", scene, true, false, Texture.BILINEAR_SAMPLINGMODE);

        assetsManager.onTasksDoneObservable.add(() => {
            NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/shields.json", scene).then((nodeMaterial) => {
                _this.shieldEffectMaterial = nodeMaterial;

                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/projectileUVShader.json", scene).then((nodeMaterial) => {
                    //NodeMaterial.ParseFromSnippetAsync("19ALD5#7", scene).then((nodeMaterial:any) => {
                    _this.projectileShader = nodeMaterial.clone("projectileMaterial", true);
                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/TrailShader.json", scene).then((nodeMaterial) => {
                    //NodeMaterial.ParseFromSnippetAsync("NLDUNC#8", scene).then((nodeMaterial:any) => {
                            _this.trailMaterial = nodeMaterial.clone("trailMaterial", true);
                        NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/explosionLayeredShader.json", scene).then((nodeMaterial) => {
                            _this.explosionMaterial = nodeMaterial.clone("explosionMaterial", true);
                            //nodeMaterial.getBlockByName("startTime").value = nodeMaterial.getBlockByName("Time").value;
                            (_this.explosionMaterial.getBlockByName("noiseTex") as TextureBlock).texture = new Texture(assetsHostUrl + "/assets/textures/noise_squareMask.png", scene, false, false);
                            _this.explosionMaterial.backFaceCulling = false;
                            _this.explosionMaterial.alphaMode = 1;
                            NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/planetShaderGreybox.json", scene).then((nodeMaterial) => {
                                _this.planetMaterial = nodeMaterial;
                                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/SparksShader.json", scene).then((nodeMaterial) => {
                                    _this.sparksEffect = nodeMaterial;
                                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/asteroidsTriplanarShader.json", scene).then((nodeMaterial) => {
                                        _this.asteroidsTriPlanar = nodeMaterial;

                                        if (Parameters.enableAudio) {
                                            this.audio = new AudioAssets(assetsHostUrl, scene);
                                        }

                                        const starfieldTexture = new Texture(assetsHostUrl + "/assets/textures/starfield_panorama_texture.jpg", scene, false, false);
                                        if(_this.starfieldTextureBlock) {
                                            (_this.starfieldTextureBlock as TextureBlock).texture = starfieldTexture;
                                        }
                                        Assets.loadingComplete = true;
                                        whenLoadingComplete(this);
                                        console.log("Complete asset loading done");
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        assetsManager.load();
    }
    async loadAssets() {
        return new Promise((resolve, reject) => {
        });
    }

    dispose() {
    }
}

class AudioAssets {
    public ready = false;
    public explosionSounds: Sound[];
    public heroLaserSounds: Sound[];
    public raiderLaserSounds: Sound[];
    public thrusterSound: Sound;
    public heroEngineSound: Sound;
    //public raiderEngineSound: Sound;
    public laserHitSound: Sound;
    public missileFireSound: Sound;

    private _sounds = 0;
    private _soundCount = 6;

    constructor(assetsHostUrl: string, scene: Scene) {
        this.explosionSounds = [new Sound("explosion", assetsHostUrl + "/assets/sounds/explosions/explosion1.mp3", scene, this.soundReady, {
                spatialSound: true,
                distanceModel: "exponential",
                rolloffFactor: 0.2,
                volume: 2
            }),
            new Sound("explosion", assetsHostUrl + "/assets/sounds/explosions/explosion2.mp3", scene, this.soundReady, {
                spatialSound: true,
                distanceModel: "exponential",
                rolloffFactor: 0.2,
                volume: 2
            })];

        this.heroLaserSounds = [new Sound("laser", assetsHostUrl + "/assets/sounds/heroShip/heroLaser1.mp3", scene, this.soundReady, {
                spatialSound: false,
                distanceModel: "exponential",
                rolloffFactor: 1,
                volume: 1
            }),
            new Sound("laser", assetsHostUrl + "/assets/sounds/heroShip/heroLaser2.mp3", scene, this.soundReady, {
                spatialSound: false,
                distanceModel: "exponential",
                rolloffFactor: 1,
                volume: 1
            }),
            new Sound("laser", assetsHostUrl + "/assets/sounds/heroShip/heroLaser3.mp3", scene, this.soundReady, {
                spatialSound: false,
                distanceModel: "exponential",
                rolloffFactor: 1,
                volume: 1
            })];
        this.raiderLaserSounds = [new Sound("laser", assetsHostUrl + "/assets/sounds/raider/raiderLaser1.mp3", scene, this.soundReady, {
                spatialSound: true,
                distanceModel: "exponential",
                rolloffFactor: 1,
                volume: 1
            }),
            new Sound("laser", assetsHostUrl + "/assets/sounds/raider/raiderLaser2.mp3", scene, this.soundReady, {
                spatialSound: true,
                distanceModel: "exponential",
                rolloffFactor: 1,
                volume: 1
            }),
            new Sound("laser", assetsHostUrl + "/assets/sounds/raider/raiderLaser3.mp3", scene, this.soundReady, {
                spatialSound: true,
                distanceModel: "exponential",
                rolloffFactor: 1,
                volume: 1
            })];

        this.thrusterSound = new Sound("thruster", assetsHostUrl + "/assets/sounds/heroShip/thrusterFire_000.ogg", scene, this.soundReady, {
            autoplay: true,
            loop: true,
            volume: 0
        });
        this.heroEngineSound = new Sound("engine", assetsHostUrl + "/assets/sounds/heroShip/heroShipFlying.mp3", scene, this.soundReady, {
            autoplay: true,
            loop: true,
            volume: 1
        });
        /*this.raiderEngineSound = new Sound("engine", assetsHostUrl + "/assets/sounds/raider/raiderFlying.mp3", scene, this.soundReady, {
            autoplay: true,
            loop: true,
            volume: 0.1
        });*/

        this.laserHitSound = new Sound("laserHit", assetsHostUrl + "/assets/sounds/raider/raiderHitByLaser", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 0.7,
            volume: 3
        });
        this.missileFireSound = new Sound("missileFire", assetsHostUrl + "/assets/sounds/heroShip/rocketLaunch.mp3", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 8
        });
    }

    soundReady() {
        this._sounds++;
        if (this._sounds == this._soundCount) {
            this.ready = true;
        }
    }
}