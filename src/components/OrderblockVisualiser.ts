// src/utils/orderBlockVisualization.ts
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Rectangle } from '../plugins/RectanglePlugin';
import { OrderBlock } from '../services/OrderBlockAnalysis';

export function visualizeOrderBlocks(
    chart: IChartApi,
    mainSeries: ISeriesApi<"Candlestick">,
    orderBlocks: OrderBlock[]
) {
    orderBlocks.forEach(block => {
        const rectangle = new Rectangle(
            {
                time: block.startTime / 1000, // Convert to seconds for lightweight-charts
                price: block.highPrice
            },
            {
                time: block.endTime / 1000,
                price: block.lowPrice
            },
            {
                fillColor: block.type === 'bullish' 
                    ? 'rgba(34, 197, 94, 0.2)'  // Green
                    : 'rgba(239, 68, 68, 0.2)', // Red
                borderColor: block.type === 'bullish'
                    ? 'rgba(34, 197, 94, 1)'
                    : 'rgba(239, 68, 68, 1)',
                borderWidth: block.validationMetrics.impulseStrength > 1.5 ? 2 : 1,
                opacity: block.validationMetrics.gapQuality,
                extend: 'right' // Extend to the right of the chart
            }
        );

        mainSeries.attachPrimitive(rectangle);
    });
}