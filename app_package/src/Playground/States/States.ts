import { BattleSelect } from "./BattleSelect";
import { Credits } from "./Credits";
import { Dead } from "./Dead";
import { GameState } from "./GameState";
import { InGameMenu } from "./InGameMenu";
import { Main } from "./Main";
import { Options } from "./Options";
import { Victory } from "./Victory";
import { PhotoMode } from "./PhotoMode";

export class States {
    public static battleSelect = new BattleSelect;
    public static credits = new Credits;
    public static dead = new Dead;
    public static gameState = new GameState;
    public static inGameMenu = new InGameMenu;
    public static main = new Main;
    public static options = new Options;
    public static victory = new Victory;
    public static photoMode = new PhotoMode;
}

