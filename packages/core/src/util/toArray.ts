type ArrayElement<T> = T extends unknown[] ? T[number] : T;

export default function toArray<T>(v: T): ArrayElement<T>[] {
    if (Array.isArray(v)) return v;
    if (!!v) return [v as any];
    return [];
}
