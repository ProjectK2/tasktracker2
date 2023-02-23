export const dateToReadableTimeString = (d: Date): string => {
    const hour = d.getHours();
    const min = d.getMinutes();
    const sec = d.getSeconds();
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export const msecToReadableString = (msec: number): string => {
    const hour = Math.floor(msec / 1000 / 60 / 60);
    const min = Math.floor(msec / 1000 / 60 % 60);
    const sec = Math.floor(msec / 1000 % 60);
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}