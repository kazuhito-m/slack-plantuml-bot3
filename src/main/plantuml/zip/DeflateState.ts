import Constant from "./Constant";

export default class DeflateState {

    private _window: Array<number>;
    private _strstart: number = 0;

    constructor() {
        this._window = new Array(Constant.WINDOW_SIZE);
    }

    public initialize = () => {
        this.constructor();
    }

    public positionCodeOffset = (offset : number):number => {
        return this._window[this._strstart + offset] & 0xff;
    }

    public firstPositionCode = ():number => {
        return this.positionCodeOffset(0);
    }

    public moveNextStartPostion = () => {
        this._strstart++;
    }

    public movePosition = (length : number) => {
        this._strstart += length;
    }

    public clearPosition = () => {
        this._strstart = 0;
    }

    // getter/setter

    public get window() : Array<number> {
        return  this._window;
    }

    public get strstart() {
        return this._strstart;
    }

}
