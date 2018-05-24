export default class ZipState {

    private _marked:boolean = false;

    constructor() {
    }

    public initialize = () => {
        this.constructor();
        this._marked = true;
    }

    // getter/setter

    public get markd():boolean {
        return this._marked;
    }

}
