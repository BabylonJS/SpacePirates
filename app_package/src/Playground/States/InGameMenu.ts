import { Control, Button, Grid, StackPanel } from "@babylonjs/gui";
import { InputManager } from "../Inputs/Input";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Parameters } from "../Parameters";
import { GuiFramework } from "../GuiFramework";

export class InGameMenu extends State {
  public exit() {
    super.exit();
  }

  public enter() {
    super.enter();

    if (!this._adt) {
      return;
    }

    GameState.gameSession?.pause();

    GuiFramework.createBottomBar(this._adt);
    var panel = new StackPanel();
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    let grid = new Grid();
    GuiFramework.formatButtonGrid(grid);
    grid.addControl(panel, 0, 0);

    GuiFramework.addButton("Continue", panel).onPointerDownObservable.add(
      function (info) {
        InputManager.setupPointerLock();
        State.setCurrent(States.gameState);
      }
    );

    GuiFramework.addButton("Options", panel).onPointerDownObservable.add(
      function (info) {
        States.options.backDestination = States.inGameMenu;
        State.setCurrent(States.options);
      }
    );

    const game = GameState.gameSession?.getGame();
    if (
      game &&
      game.humanPlayerShips.length == 1 &&
      Parameters.recorderActive
    ) {
      GuiFramework.addButton("Photo mode", panel).onPointerDownObservable.add(
        function (info) {
          State.setCurrent(States.photoMode);
        }
      );
    }

    GuiFramework.addButton("Back to menu", panel).onPointerDownObservable.add(
      function (info) {
        GameState.gameSession?.stop();
        State.setCurrent(States.main);
      }
    );

    this._adt.addControl(grid);
  }
}
