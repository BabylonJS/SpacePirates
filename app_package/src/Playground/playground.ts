import { Scene, Vector3, Engine, FreeCamera, DirectionalLight, Color3, GlowLayer, ImageProcessingConfiguration, Color4, Nullable } from "@babylonjs/core";
import { Assets } from "./Assets";
import { States } from "./States/States";
import { State } from "./States/State";
import { GameState } from "./States/GameState";
import { GameSession } from "./States/GameSession";
import { Diorama } from "./States/Diorama";
import { Main } from "./States/Main";
import { Parameters } from './Parameters';

class Playground {
    public static CreateScene(engine: Engine, assetsHostUrl: string, canvas: HTMLCanvasElement): Scene {
        
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new Scene(engine);

        //scene.autoClear = false;
        scene.clearColor = new Color4(0,0,0,1);
        scene.autoClearDepthAndStencil = false;
        scene.skipPointerMovePicking = true;
        scene.pointerUpPredicate = ()=> false;
        scene.pointerDownPredicate = ()=> false;
        scene.pointerMovePredicate = ()=> false;

        // lighting
        const dirLight = new DirectionalLight("dirLight", new Vector3(0.47, -0.19, -0.86), scene);
        dirLight.diffuse = Color3.FromInts(255, 251, 199);
        dirLight.intensity = 1.5;

        // material image processing
        const imageProcessing = scene.imageProcessingConfiguration;
        imageProcessing.toneMappingEnabled = true;
        imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
        imageProcessing.exposure = 2.0;

        // glow
        const glowLayer = new GlowLayer("glowLayer", scene);
        glowLayer.intensity = 1.2;

        // This creates and positions a free camera (non-mesh)
        var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

        new Assets(scene, assetsHostUrl, (assets) => {
            GameState.gameSession = new GameSession(assets, scene, canvas, glowLayer);
            Main.diorama = new Diorama(scene, assets, engine, glowLayer);
            States.photoMode.assets = assets;
            State.setCurrent(States.main);
            // jump directly in the game
            //State.setCurrent(States.gameState);
        },
        (assets) => {
            if (Main.playButton) {
                Main.playButton.isVisible = true;
            }
        });
        return scene;
    }
}

export function CreatePlaygroundScene(engine: Engine, assetsHostUrl: string, canvas: HTMLCanvasElement): Scene {
    return Playground.CreateScene(engine, assetsHostUrl, canvas);
}
