/**
 * 工具函数模块 - Utils.ts
 *
 * @fileOverview 纯函数工具集，无外部依赖
 */

export default class Utils {
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public static randomChoice<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    public static shuffle<T>(array: T[]): T[] {
        const newArray = array.slice();
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = newArray[i];
            newArray[i] = newArray[j];
            newArray[j] = temp;
        }
        return newArray;
    }

    /**
     * 深拷贝对象
     */
    public static deepCopy<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            const arrCopy: any[] = [];
            for (let i = 0; i < obj.length; i++) {
                arrCopy[i] = Utils.deepCopy(obj[i]);
            }
            return arrCopy as unknown as T;
        }
        if (typeof obj === 'function') {
            return obj;
        }
        const objCopy: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                objCopy[key] = Utils.deepCopy((obj as any)[key]);
            }
        }
        return objCopy;
    }

    public static manhattanDistance(r1: number, c1: number, r2: number, c2: number): number {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    public static sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
