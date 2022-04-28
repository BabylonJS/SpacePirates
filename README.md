# Space dog fight

In root folder:
`npm install`
To run with watch build:
`npm run dev`
To package:
`npm run build`

# Building for BabylonNative

- in `playgroundRunner.ts`, set `useNative` to true.
- Run `npm run build`
- copy .js and assets in assets folder
- update scriptloader to load this js

# Building for BabylonReactNative

- Ensure fix with morph GPU (Babylon 5.0.0-beta.6) is in
- copy .ts in `playground-shared`
- Start a web server with Python 3 to access `assets` folder : `python -m http.server 8000 --bind 0.0.0.0`
- `adb reverse tcp:8000 tcp:8000` so localhost:8000 will point to your workstation with running http server
- replace `App.tsx` in BRN playground with the one in `ReactApp` folder

## Architecture

### Agent
Base class for Missiles and ship. Responsible for doing to orientation work to go toward a direction. Can be piloted by AI or user inputs

### Assets
Loading and providing assets for whole experience

### Camera
Following camera behind player (or any one ship)

### DogFight
Main hub for experience. Game state (menu -> game -> game over screen-> credits) should be created in this ts.
A Game can be instanced, stopped, etc

### Input
InputManager provide infos to fill Input (mouse, keyboard, pad, you name it). Input can also be filled with AI data but it's not done here.

### Missile, Shots, Trail
Not so interesting. Might document later

### World
Class responsible for world creation (skybox, planet, env,...).
Instanced by DogFight class.
Create your level/world here based on loaded assets

### Missing
Sound, UI, menu screens

