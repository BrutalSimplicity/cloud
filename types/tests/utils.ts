export function sleepSync(milliseconds: number) {
    let end = Date.now() + milliseconds;
    while(Date.now() < end) { }
}
