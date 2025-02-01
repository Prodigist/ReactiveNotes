import {
	IChartApi,
	ISeriesApi,
	SeriesOptionsMap,
	Time,
} from 'lightweight-charts';
import { CustomPrimitivesOptions } from './options';

export interface Point {
	time: Time;
	price: number;
}

export interface CustomPrimitivesDataSource {
	chart: IChartApi;
	series: ISeriesApi<keyof SeriesOptionsMap>;
	options: CustomPrimitivesOptions;
	p1: Point;
	p2: Point;
}
