import { Engine, Vector3, Scene, RenderTargetTexture, VolumetricLightScatteringPostProcess, SphereParticleEmitter, SceneLoader, Texture, Color3, Nullable, StandardMaterial, NodeMaterial, MeshBuilder, Mesh, AbstractMesh, Color4, ArcRotateCamera, TextureBlock, Camera, GlowLayer } from "@babylonjs/core";
import { Assets } from "../Assets";

export class PlanetBaker {
    renderTargetPlanet: RenderTargetTexture;
    sunPosition: any;
    planet: Nullable<AbstractMesh> = null;
    atmosphere: Nullable<AbstractMesh> = null;
    //private _sun: AbstractMesh;
    constructor(scene: Scene, assetsHostUrl: string, renderTargetSize: number) {

        this.renderTargetPlanet = new RenderTargetTexture('planetRT', renderTargetSize, scene, false, false);//undefined, undefined, TextureFormat.RGBA8Unorm);
        scene.customRenderTargets.push(this.renderTargetPlanet);
        this.renderTargetPlanet.clearColor = new Color4(0, 0, 0, 0);
        var camera = new ArcRotateCamera("planetRTCamera", 0, 0, 2, new Vector3(0,0,0), scene);
        this.renderTargetPlanet.activeCamera = camera;
        
        // planet
        SceneLoader.AppendAsync(assetsHostUrl + "/assets/gltf/planet_mesh.glb").then((loadedScene: Scene) =>{
            this.planet = scene.getMeshByName("planet_mesh");
            this.atmosphere = scene.getMeshByName("atmosphere_mesh");
            
            if (this.atmosphere && this.planet && this.renderTargetPlanet && this.renderTargetPlanet.renderList) {
                this.renderTargetPlanet.renderList.push(this.planet);
                this.renderTargetPlanet.renderList.push(this.atmosphere);
                scene.removeMesh(this.planet);
                scene.removeMesh(this.atmosphere);

                this.atmosphere.billboardMode = Mesh.BILLBOARDMODE_ALL;
                this.atmosphere.scaling.x = 4;
                this.atmosphere.scaling.y = 4;

                this.planet.scaling = new Vector3(3.6, 3.6, 3.6);
                let shadowTexture = new Texture(assetsHostUrl + "/assets/textures/planet_shadow.jpg", scene, false, false)
        
                // with alpha #ZI6R7T
                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/atmosphereShader.json", scene).then((atmosphereMaterial: NodeMaterial) => {
                    atmosphereMaterial.build(false);
                    atmosphereMaterial.alpha = 0.999;
                    atmosphereMaterial.alphaMode = Engine.ALPHA_COMBINE;
                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/assets/shaders/planetLightingShader.json", scene).then((planetLightingMaterial: NodeMaterial) => {
                        planetLightingMaterial.build(false);
                        let planetBaseColor = planetLightingMaterial.getBlockByName("baseColorTex") as TextureBlock;
                        let planetRoughness = planetLightingMaterial.getBlockByName("roughnessTex") as TextureBlock;
                        let planetNormal = planetLightingMaterial.getBlockByName("normalTex") as TextureBlock;
                        let planetShadow = planetLightingMaterial.getBlockByName("shadowTex") as TextureBlock;
                        this.sunPosition = planetLightingMaterial.getBlockByName("sunPosition");
                        if (this.planet && this.planet.material) {
                            planetBaseColor.texture = (this.planet.material as any).albedoTexture;
                            planetRoughness.texture = (this.planet.material as any).metallicTexture;
                            planetNormal.texture = (this.planet.material as any).bumpTexture;
                            planetShadow.texture = shadowTexture;
                            this.sunPosition.value = new Vector3(-2,-10,20);
                            this.planet.material = planetLightingMaterial;
                        }
                        if (this.atmosphere) {
                            this.atmosphere.material = atmosphereMaterial;
                        }
                    });
                });
            }
        });
    }

    public createPlanet(scene: Scene, worldSize: number, glowLayer: GlowLayer): Mesh {
        var planet = MeshBuilder.CreatePlane("planetPlane", {size: worldSize}, scene);
        planet.billboardMode = Mesh.BILLBOARDMODE_ALL | Mesh.BILLBOARDMODE_USE_POSITION;
        var planetMaterial = new StandardMaterial("", scene);
        planetMaterial.backFaceCulling = false;
        planetMaterial.disableLighting = true;
        planetMaterial.diffuseTexture = this.renderTargetPlanet;
        planetMaterial.emissiveColor = new Color3(1,1,1);
        planetMaterial.alphaMode = Engine.ALPHA_COMBINE;
        planetMaterial.diffuseTexture.hasAlpha = true;
        planetMaterial.useAlphaFromDiffuseTexture = true;
        planet.material = planetMaterial;
        planet.alphaIndex = 5;
        glowLayer.addExcludedMesh(planet);
        
        this.renderTargetPlanet.refreshRate = 0;
        return planet;
    }

    public static CreateSunPostProcess(camera: Camera, scene: Scene, assets: Assets): VolumetricLightScatteringPostProcess {
        const sun = new VolumetricLightScatteringPostProcess('volumetric', 1.0, camera, undefined, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);

        // By default it uses a billboard to render the sun, just apply the desired texture
        if (sun.mesh && sun.mesh.material)
        {
            (sun.mesh.material as any).diffuseTexture = assets.sunTexture;
            (sun.mesh.material as any).diffuseTexture.hasAlpha = true;
            sun.mesh.scaling = new Vector3(150, 150, 150);
        }
        return sun;
    }
}