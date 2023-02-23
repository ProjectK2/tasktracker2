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

export const msecToReadableStringJp = (msec: number): string => {
    const hour = Math.floor(msec / 1000 / 60 / 60);
    const min = Math.floor(msec / 1000 / 60 % 60);
    const sec = Math.floor(msec / 1000 % 60);
    let s = `${sec.toString()}秒`;
    if (hour > 0 || min > 0) {
        s = `${min.toString()}分` + s;
    }
    if (hour > 0) {
        s = `${hour.toString()}時間` + s;
    }
    return s;
}

export const toKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return `${year}/${month}/${day}`;
}