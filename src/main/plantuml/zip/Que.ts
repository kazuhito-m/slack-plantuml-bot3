import DeflateBuffer from "./DeflateBuffer";
import Constant from "./Constant";

export default class Quw {

    private _free_queue: DeflateBuffer | null;
    private _qhead: DeflateBuffer | null;
    private _qtail: DeflateBuffer | null;

    private _outcnt: number;
    private _outoff: number;
    private _outbuf: Array<number>;

    constructor() {
        this._free_queue = null;
        this._qhead = null;
        this._qtail = null;
        this._outbuf = new Array(Constant.OUTBUFSIZ);
        this._outcnt = 0;
        this._outoff = 0;
    }

    public initialize = () => {
        this.constructor();
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
        while (this._qhead != null && n < buff_size) {
            i = buff_size - n;
            if (i > this._qhead.len)
                i = this._qhead.len;
            //      System.arraycopy(qhead.ptr, qhead.off, buff, off + n, i);
            for (j = 0; j < i; j++)
                buff[off + n + j] = this._qhead.ptr[this._qhead.off + j];

            this._qhead.off += i;
            this._qhead.len -= i;
            n += i;
            if (this._qhead.len == 0) {
                const p = this._qhead;
                this._qhead = this._qhead.next;
                this.reuse_queue(p);
            }
        }

        if (n == buff_size) return n;

        if (this._outoff < this._outcnt) {
            i = buff_size - n;
            if (i > this._outcnt - this._outoff)
                i = this._outcnt - this._outoff;


            // System.arraycopy(outbuf, outoff, buff, off + n, i);
            for (j = 0; j < i; j++)
                buff[off + n + j] = this._outbuf[this._outoff + j];
            this._outoff += i;
            n += i;
            if (this._outcnt == this._outoff) {
                this._outcnt = this._outoff = 0;
            }
        }
        return n;
    }

    private reuse_queue = (p: DeflateBuffer) => {
        p.next = this._free_queue;
        this._free_queue = p;
    }

    public queClear = () => {
        this._qhead = null;
        this._outcnt = 0;
        this._outoff = 0;
    }

    public nothingQueHead = () => {
        return this._qhead == null;
    }

    public put_short = (w: number) => {
        w &= 0xffff;
        if (this._outoff + this._outcnt < Constant.OUTBUFSIZ - 2) {
            this._outbuf[this._outoff + this._outcnt++] = (w & 0xff);
            this._outbuf[this._outoff + this._outcnt++] = (w >>> 8);
        } else {
            this.put_byte(w & 0xff);
            this.put_byte(w >>> 8);
        }
    }

    public put_byte = (c: number) => {
        this._outbuf[this._outoff + this._outcnt++] = c;
        if (this._outoff + this._outcnt == Constant.OUTBUFSIZ)
            this.qoutbuf();
    }

    private qoutbuf = () => {
        if (this._outcnt != 0) {
            const q = this.new_queue();
            if (this._qhead == null)
                this._qhead = this._qtail = q;
            else
                this._qtail = q;
            this._qtail.next = q;
            q.len = this._outcnt - this._outoff;
            for (let i = 0; i < q.len; i++)
                q.ptr[i] = this._outbuf[this._outoff + i];
            this._outcnt = this._outoff = 0;
        }
    }

    private new_queue = (): DeflateBuffer => {
        let p = new DeflateBuffer();
        if (this._free_queue != null) {
            p = this._free_queue;
            this._free_queue = this._free_queue.next;
        }
        p.next = null;
        p.len = 0;
        p.off = 0;
        return p;
    }

    // getter/setter

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

    public get outoff(): number {
        return this._outoff;
    }

    public set outoff(value: number) {
        this._outoff = value;
    }

}
