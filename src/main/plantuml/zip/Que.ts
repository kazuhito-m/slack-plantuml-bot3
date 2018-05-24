import DeflateBuffer from "./DeflateBuffer";
import Constant from "./Constant";

export default class Quw {

    private _free_queue: DeflateBuffer | null;
    private _qhead: DeflateBuffer | null;
    private _qtail: DeflateBuffer | null;

    private _outcnt: number = 0;
    private _outoff: number = 0;
    private _outbuf: Array<number>;

    private _marked:boolean = false;

    constructor() {
        this._free_queue = null;
        this._qhead = null;
        this._qtail = null;
        this._outbuf = new Array(Constant.OUTBUFSIZ);
    }

    public initialize = () => {
        this.constructor();
        this._marked = true;
    }

    public qcopy = (
        buff: Array<number>, 
        off: number,
        buff_size: number
    ): number => {
        let n: number;
        let i: number;
        let j: number;

        n = 0;
        while (this.qhead != null && n < buff_size) {
            i = buff_size - n;
            if (i > this.qhead.len)
                i = this.qhead.len;
            //      System.arraycopy(qhead.ptr, qhead.off, buff, off + n, i);
            for (j = 0; j < i; j++)
                buff[off + n + j] = this.qhead.ptr[this.qhead.off + j];

            this.qhead.off += i;
            this.qhead.len -= i;
            n += i;
            if (this.qhead.len == 0) {
                const p = this.qhead;
                this.qhead = this.qhead.next;
                this.reuse_queue(p);
            }
        }

        if (n == buff_size) return n;

        if (this.outoff < this.outcnt) {
            i = buff_size - n;
            if (i > this.outcnt - this.outoff)
                i = this.outcnt - this.outoff;


            // System.arraycopy(outbuf, outoff, buff, off + n, i);
            for (j = 0; j < i; j++)
                buff[off + n + j] = this.outbuf[this.outoff + j];
            this.outoff += i;
            n += i;
            if (this.outcnt == this.outoff) {
                this.outcnt = this.outoff = 0;
            }
        }
        return n;
    }

    private reuse_queue = (p: DeflateBuffer) => {
        p.next = this.free_queue;
        this.free_queue = p;
    }

    public queClear= () => {
        this.qhead = null;
        this.outcnt = 0;
        this.outoff = 0;
    }

    public nothingQueHead = () => {
        return this.qhead == null;   
    }

    public put_short = (w: number) => {
        w &= 0xffff;
        if (this.outoff + this.outcnt < Constant.OUTBUFSIZ - 2) {
            this.outbuf[this.outoff + this.outcnt++] = (w & 0xff);
            this.outbuf[this.outoff + this.outcnt++] = (w >>> 8);
        } else {
            this.put_byte(w & 0xff);
            this.put_byte(w >>> 8);
        }
    }

    public put_byte = (c: number) => {
        this.outbuf[this.outoff + this.outcnt++] = c;
        if (this.outoff + this.outcnt == Constant.OUTBUFSIZ)
            this.qoutbuf();
    }

    private qoutbuf = () => {
        if (this.outcnt != 0) {
            const q = this.new_queue();
            if (this.qhead == null)
                this.qhead = this._qtail = q;
            else 
                this._qtail = q;
                this._qtail.next = q;
            q.len = this.outcnt - this.outoff;
            for (let i = 0; i < q.len; i++)
                q.ptr[i] = this.outbuf[this.outoff + i];
            this.outcnt = this.outoff = 0;
        }
    }

    private new_queue = (): DeflateBuffer => {
        let p = new DeflateBuffer();
        if (this.free_queue != null) {
            p = this.free_queue;
            this.free_queue = this.free_queue.next;
        }
        p.next = null;
        p.len = 0;
        p.off = 0;
        return p;
    }

    // getter/setter

    public get markd():boolean {
        return this._marked;
    }

    public get free_queue(): DeflateBuffer | null {
        return this._free_queue;
    }

    public set free_queue(value: DeflateBuffer | null) {
        this._free_queue = value;
    }

    public get qhead(): DeflateBuffer | null {
        return this._qhead;
    }

    public set qhead(value: DeflateBuffer | null) {
        this._qhead = value;
    }

    public get outoff():number {
        return this._outoff;
    }

    public set outoff(value:number) {
        this._outoff = value;
    }

    public get outcnt():number {
        return this._outcnt;
    }

    public set outcnt(value:number) {
        this._outcnt = value;
    }

    public get outbuf():Array<number> {
        return this._outbuf;
    }

    public set outbuf(value:Array<number> )  {
        this._outbuf = value;
    }

}
