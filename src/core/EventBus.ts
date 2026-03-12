/**
 * EventBus - 轻量级事件总线
 * 
 * @fileOverview 发布/订阅模式，解耦系统间通信
 * @description 所有系统通过 EventBus 通信，而非直接互相调用
 */

type EventHandler = (data: any) => void;
type WrappedHandler = EventHandler & { _original?: EventHandler };

export default class EventBus {
    private _listeners: Record<string, WrappedHandler[]> = {};

    constructor() {}

    /**
     * 注册事件监听器
     * @param event - 事件名
     * @param handler - 处理函数
     * @returns this（链式调用）
     */
    public on(event: string, handler: EventHandler): this {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(handler);
        return this;
    }

    /**
     * 移除事件监听器
     * @param event - 事件名
     * @param handler - 处理函数
     * @returns this
     */
    public off(event: string, handler: EventHandler): this {
        if (!this._listeners[event]) return this;
        this._listeners[event] = this._listeners[event].filter(h => h !== handler && h._original !== handler);
        return this;
    }

    /**
     * 触发事件
     * @param event - 事件名
     * @param data - 传递给监听器的数据
     * @returns this
     */
    public emit(event: string, data?: any): this {
        const handlers = this._listeners[event];
        if (!handlers) return this;
        
        // 复制数组防止 handler 内部 off 导致跳过
        const copy = handlers.slice();
        for (const handler of copy) {
            handler(data);
        }
        return this;
    }

    /**
     * 注册一次性监听器（触发后自动移除）
     * @param event - 事件名
     * @param handler - 处理函数
     * @returns this
     */
    public once(event: string, handler: EventHandler): this {
        const wrapper: WrappedHandler = (data: any) => {
            this.off(event, wrapper);
            handler(data);
        };
        wrapper._original = handler;
        return this.on(event, wrapper);
    }
}
