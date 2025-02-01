// src/component/RectPlugin.ts
interface Point {
    time: number;
    price: number;
}

interface RectangleOptions {
    fillColor?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
    extend?: 'none' | 'right';
}

export class Rectangle {
    private _point1: Point;
    private _point2: Point;
    private _options: Required<RectangleOptions>;

    private static readonly defaultOptions: Required<RectangleOptions> = {
        fillColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 1,
        opacity: 0.2,
        extend: 'none'
    };

    constructor(point1: Point, point2: Point, options: RectangleOptions = {}) {
        this._point1 = point1;
        this._point2 = point2;
        this._options = { ...Rectangle.defaultOptions, ...options };
    }

    draw(ctx: CanvasRenderingContext2D, pixelRatio: number, model: any): void {
        const points = this._calculatePoints(model);
        if (!points) return;

        const { x1, y1, x2, y2 } = points;

        ctx.save();

        // Set line style
        ctx.lineWidth = this._options.borderWidth * pixelRatio;
        ctx.strokeStyle = this._options.borderColor;
        ctx.fillStyle = this._options.fillColor;

        // Draw rectangle
        ctx.beginPath();
        ctx.rect(
            Math.round(x1 * pixelRatio),
            Math.round(y1 * pixelRatio),
            Math.round((x2 - x1) * pixelRatio),
            Math.round((y2 - y1) * pixelRatio)
        );

        // Fill with semi-transparency
        ctx.globalAlpha = this._options.opacity;
        ctx.fill();

        // Draw border
        ctx.globalAlpha = 1;
        ctx.stroke();

        ctx.restore();
    }

    hitTest(x: number, y: number): boolean {
        // Implement hit testing if needed
        return false;
    }

    private _calculatePoints(model: any) {
        const point1X = model.timeScale().timeToCoordinate(this._point1.time);
        const point2X = this._options.extend === 'right' 
            ? model.timeScale().getWidth()
            : model.timeScale().timeToCoordinate(this._point2.time);

        const point1Y = model.priceScale('right').priceToCoordinate(this._point1.price);
        const point2Y = model.priceScale('right').priceToCoordinate(this._point2.price);

        if (!point1X || !point2X || !point1Y || !point2Y) {
            return null;
        }

        return {
            x1: Math.min(point1X, point2X),
            y1: Math.min(point1Y, point2Y),
            x2: Math.max(point1X, point2X),
            y2: Math.max(point1Y, point2Y)
        };
    }
}