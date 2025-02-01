import {
	Coordinate,
	ISeriesPrimitivePaneView,
	SeriesPrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { CustomPrimitivesAxisPaneRenderer } from './axis-pane-renderer';
import { CustomPrimitivesDataSource } from './data-source';

abstract class CustomPrimitivesAxisPaneView implements ISeriesPrimitivePaneView {
	_source: CustomPrimitivesDataSource;
	_p1: number | null = null;
	_p2: number | null = null;
	_vertical: boolean = false;

	constructor(source: CustomPrimitivesDataSource, vertical: boolean) {
		this._source = source;
		this._vertical = vertical;
	}

	abstract getPoints(): [Coordinate | null, Coordinate | null];

	update() {
		[this._p1, this._p2] = this.getPoints();
	}

	renderer() {
		return new CustomPrimitivesAxisPaneRenderer(
			this._p1,
			this._p2,
			this._source.options.fillColor,
			this._vertical
		);
	}
	zOrder(): SeriesPrimitivePaneViewZOrder {
		return 'bottom';
	}
}

export class CustomPrimitivesPriceAxisPaneView extends CustomPrimitivesAxisPaneView {
	getPoints(): [Coordinate | null, Coordinate | null] {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source.p1.price);
		const y2 = series.priceToCoordinate(this._source.p2.price);
		return [y1, y2];
	}
}

export class CustomPrimitivesTimeAxisPaneView extends CustomPrimitivesAxisPaneView {
	getPoints(): [Coordinate | null, Coordinate | null] {
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source.p1.time);
		const x2 = timeScale.timeToCoordinate(this._source.p2.time);
		return [x1, x2];
	}
}
