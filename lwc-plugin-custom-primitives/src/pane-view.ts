import { Coordinate, ISeriesPrimitivePaneView } from 'lightweight-charts';
import { CustomPrimitivesPaneRenderer } from './pane-renderer';
import { CustomPrimitivesDataSource } from './data-source';

export interface ViewPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

export class CustomPrimitivesPaneView implements ISeriesPrimitivePaneView {
	_source: CustomPrimitivesDataSource;
	_p1: ViewPoint = { x: null, y: null };
	_p2: ViewPoint = { x: null, y: null };

	constructor(source: CustomPrimitivesDataSource) {
		this._source = source;
	}

	update() {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source.p1.price);
		const y2 = series.priceToCoordinate(this._source.p2.price);
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source.p1.time);
		const x2 = timeScale.timeToCoordinate(this._source.p2.time);
		this._p1 = { x: x1, y: y1 };
		this._p2 = { x: x2, y: y2 };
	}

	renderer() {
		return new CustomPrimitivesPaneRenderer(
			this._p1,
			this._p2,
			this._source.options.fillColor
		);
	}
}
