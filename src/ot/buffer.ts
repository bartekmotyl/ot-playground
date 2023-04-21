
export interface Buffer {
    insert(idx: number, s: string): void,
    delete(idx: number, count: number): void,
    getText(): string,
}

export class SimpleBuffer implements Buffer{
    private text: string = ''

    public insert(idx: number, s: string) {
        this.text = this.text.slice(0, idx) + s + this.text.slice(idx);
    }
    public delete(idx: number, count: number) {
        this.text = this.text.slice(0, idx) + this.text.slice(idx + count);
    }
    public getText() { 
        return this.text 
    }
}


