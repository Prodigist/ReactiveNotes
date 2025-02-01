// src/services/OrderBlockAnalysis.ts
import { TFile } from 'obsidian';
import { MarketDataService, MarketData } from './marketDataService';
import { MarketDataStorage } from './marketDataStorage';

interface SwingPoint {
    time: number;
    price: number;
    type: 'high' | 'low';
    index: number;
}
interface TrendLeg {
    startIndex: number;
    endIndex: number;
    startTime: number;
    endTime: number;
    direction: 'up' | 'down' | 'sideways';
    strength: number;
    startPrice: number;
    endPrice: number;
    swingPoints: SwingPoint[];
}
interface OrderBlock {
    id: string;
    type: 'bullish' | 'bearish';
    startTime: number;
    endTime: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
    impulseMagnitude: number;
    priceValueGap: number;
    validationMetrics: {
        trendAlignment: boolean;
        hasBreakOfStructure: boolean;
        gapQuality: number; // 0-1 score
        impulseStrength: number; // Relative to average movement
    };
}

interface AnalysisResult {
    symbol: string;
    timeframe: string;
    analysisTime: number;
    marketHours: {
        start: number;
        end: number;
    };
    marketData: MarketData[];  // Add this
    trendLegs: TrendLeg[];     // Add this
    trend: {
        direction: 'up' | 'down' | 'none';
        strength: number;
        swingPoints: SwingPoint[];
    };
    orderBlocks: OrderBlock[];
}

export class OrderBlockAnalysisService {
    private static readonly MARKET_HOURS = {
        start: { hour: 9, minute: 30 },
        end: { hour: 16, minute: 0 }
    };
// Analysis specific params
    private static readonly ANALYSIS_PARAMS = {
        minSwingPoints: 4,
        lookbackPeriods: 20,
        minImpulseStrength: 1.5,
        minGapSize: 0.1, // 10% of average candle size
        trendStrengthThreshold: 0.6
    };
    private static readonly TREND_PARAMS = {
        minSwingPoints: 2,           // Reduced minimum swing points
        trendThreshold: 0.4,         // Lowered threshold
        minMovementSize: 0.1,        // Minimum % move
        swingPointConfirmation: 1,   // Candles to confirm swing
        momentumThreshold: 0.6,      // New: Momentum strength threshold
        priceChangeThreshold: 0.001  // New: Minimum price change (0.1%)
    };
    constructor(
        private storage: MarketDataStorage,
        private marketDataService: MarketDataService
    ) {}

    /**
     * Main analysis function for a given symbol and timeframe
     */
    async analyzeOrderBlocks(
        symbol: string, 
        timeframe: string,
        noteFile: TFile
    ): Promise<AnalysisResult> {
        try{
        const today = new Date();
        const startTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()-1,
            OrderBlockAnalysisService.MARKET_HOURS.start.hour,
            OrderBlockAnalysisService.MARKET_HOURS.start.minute
        ).getTime();

        const endTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()-1,
            OrderBlockAnalysisService.MARKET_HOURS.end.hour,
            OrderBlockAnalysisService.MARKET_HOURS.end.minute
        ).getTime();

        const config = {
            interval: timeframe as any,
            startTime,
            endTime
        };

        // Use the marketDataService instance for fetching
        const data = await MarketDataService.getMarketData(symbol, config, this.storage);
        
        // Apply market hours filter
        const marketHoursData = this.filterMarketHours(data);
        
        const trend = this.analyzeTrend(marketHoursData);
        const orderBlocks = this.findOrderBlocks(marketHoursData, trend);

        return {
            symbol,
            timeframe,
            analysisTime: Date.now(),
            marketHours: {
                start: startTime,
                end: endTime
            },
            marketData: marketHoursData,
            trendLegs: this.analyzeTrendLegs(marketHoursData),
            trend,
            orderBlocks
        };
    } catch (error) {
        console.error('Error analyzing order blocks:', error);
        throw error;
    }
    }

    /**
     * Filter data for market hours only
     */
    private filterMarketHours(data: MarketData[]): MarketData[] {
        return data.filter(candle => {
            const date = new Date(candle.time);
            const hours = date.getHours();
            const minutes = date.getMinutes();

            if (hours < OrderBlockAnalysisService.MARKET_HOURS.start.hour || 
                hours > OrderBlockAnalysisService.MARKET_HOURS.end.hour) return false;

            if (hours === OrderBlockAnalysisService.MARKET_HOURS.start.hour && 
                minutes < OrderBlockAnalysisService.MARKET_HOURS.start.minute) return false;

            if (hours === OrderBlockAnalysisService.MARKET_HOURS.end.hour && 
                minutes >= OrderBlockAnalysisService.MARKET_HOURS.end.minute) return false;

            return true;
        });
    }

/**
 * Enhanced trend analysis that considers both structure and momentum
 */
private analyzeTrend(data: MarketData[]): {
    direction: 'up' | 'down' | 'none';
    strength: number;
    swingPoints: SwingPoint[];
} {
    if (data.length < 10) return { direction: 'none', strength: 0, swingPoints: [] };

    const atr = this.calculateATR(data, 14);
    const swingPoints = this.findSignificantSwings(data, atr);
    
    // Calculate overall momentum
    const momentum = this.calculateMomentum(data);
    
    // Calculate price movement
    const priceChange = (data[data.length - 1].close - data[0].close) / data[0].close;
    const absolutePriceChange = Math.abs(priceChange);

    // Only proceed with detailed analysis if we have significant price movement
    if (absolutePriceChange < OrderBlockAnalysisService.TREND_PARAMS.priceChangeThreshold) {
        return { direction: 'none', strength: 0, swingPoints };
    }

    // Get structural analysis
    const structure = this.analyzeTrendStructure(swingPoints, atr);
    
    // Combine structural and momentum analysis
    const direction = this.determineOverallTrend(structure, momentum, priceChange);
    const strength = this.calculateOverallStrength(structure.strength, momentum.strength);

    return {
        direction,
        strength,
        swingPoints
    };
}

    /**
 * Calculate Average True Range
 */
private calculateATR(data: MarketData[], period: number): number {
    if (data.length < period) return 0;

    let tr = [];
    for (let i = 1; i < data.length; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = data[i-1].close;
        
        tr.push(Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        ));
    }

    // Calculate simple moving average of TR
    const atr = tr.slice(-period).reduce((sum, val) => sum + val, 0) / period;
    return atr;
}
/**
 * Calculate price momentum
 */
private calculateMomentum(data: MarketData[]): { direction: 'up' | 'down'; strength: number } {
    const closes = data.map(d => d.close);
    let upMoves = 0;
    let downMoves = 0;
    
    // Count consecutive moves
    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > closes[i - 1]) upMoves++;
        if (closes[i] < closes[i - 1]) downMoves++;
    }
    
    const totalMoves = upMoves + downMoves;
    const upStrength = upMoves / totalMoves;
    const downStrength = downMoves / totalMoves;
    
    return {
        direction: upStrength > downStrength ? 'up' : 'down',
        strength: Math.max(upStrength, downStrength)
    };
}

/**
 * Determine overall trend combining structure and momentum
 */
private determineOverallTrend(
    structure: { direction: 'up' | 'down' | 'none'; strength: number },
    momentum: { direction: 'up' | 'down'; strength: number },
    priceChange: number
): 'up' | 'down' | 'none' {
    // Strong momentum overrides structure
    if (momentum.strength > OrderBlockAnalysisService.TREND_PARAMS.momentumThreshold) {
        return momentum.direction;
    }
    
    // Strong structure with confirming price change
    if (structure.direction !== 'none' && 
        Math.sign(priceChange) === (structure.direction === 'up' ? 1 : -1)) {
        return structure.direction;
    }
    
    // Default to momentum direction if price change confirms it
    if (Math.sign(priceChange) === (momentum.direction === 'up' ? 1 : -1)) {
        return momentum.direction;
    }

    return 'none';
}

/**
 * Calculate overall trend strength
 */
private calculateOverallStrength(structureStrength: number, momentumStrength: number): number {
    return (structureStrength * 0.6 + momentumStrength * 0.4);
}
/**
 * Find significant swing points using ATR for context
 */
private findSignificantSwings(data: MarketData[], atr: number): SwingPoint[] {
    const swingPoints: SwingPoint[] = [];
    const minMove = atr * 0.3; // Reduced from 0.5 to catch more potential swings

    for (let i = 2; i < data.length - 2; i++) {
        const current = data[i];
        const before = data.slice(i - 2, i);
        const after = data.slice(i + 1, i + 3);

        // Check for swing high with relaxed conditions
        if (before.every(c => c.high <= current.high) && 
            after[0].high < current.high) {
            swingPoints.push({
                type: 'high',
                price: current.high,
                time: current.time,
                index: i
            });
        }

        // Check for swing low with relaxed conditions
        if (before.every(c => c.low >= current.low) && 
            after[0].low > current.low) {
            swingPoints.push({
                type: 'low',
                price: current.low,
                time: current.time,
                index: i
            });
        }
    }

    return swingPoints;
}

/**
 * Analyze trend structure using swing points
 */
private analyzeTrendStructure(
    swingPoints: SwingPoint[],
    atr: number
): { direction: 'up' | 'down' | 'none'; strength: number; } {
    const highs = swingPoints.filter(p => p.type === 'high')
        .sort((a, b) => a.time - b.time);
    const lows = swingPoints.filter(p => p.type === 'low')
        .sort((a, b) => a.time - b.time);

    if (highs.length < 2 || lows.length < 2) {
        return { direction: 'none', strength: 0 };
    }

    // Calculate trend metrics
    const hhSequence = this.calculateSequenceStrength(highs, 'up', atr);
    const lhSequence = this.calculateSequenceStrength(highs, 'down', atr);
    const hlSequence = this.calculateSequenceStrength(lows, 'up', atr);
    const llSequence = this.calculateSequenceStrength(lows, 'down', atr);

    // Determine trend
    const upStrength = (hhSequence + hlSequence) / 2;
    const downStrength = (lhSequence + llSequence) / 2;

    if (upStrength > OrderBlockAnalysisService.TREND_PARAMS.trendThreshold && 
        upStrength > downStrength) {
        return {
            direction: 'up',
            strength: upStrength
        };
    }

    if (downStrength > OrderBlockAnalysisService.TREND_PARAMS.trendThreshold && 
        downStrength > upStrength) {
        return {
            direction: 'down',
            strength: downStrength
        };
    }

    return { direction: 'none', strength: 0 };
}
private analyzeTrendLegs(data: MarketData[]): TrendLeg[] {
    const trendLegs: TrendLeg[] = [];
    const atr = this.calculateATR(data, 14);
    let currentLegStart = 0;

    // Minimum number of candles to consider a valid trend leg
    const MIN_LEG_LENGTH = 5;
    
    // Loop through data to identify trend changes
    for (let i = MIN_LEG_LENGTH; i < data.length - MIN_LEG_LENGTH; i++) {
        const currentSegment = data.slice(currentLegStart, i + 1);
        const nextSegment = data.slice(i - MIN_LEG_LENGTH, i + MIN_LEG_LENGTH);
        
        // Check for trend change
        if (this.isTrendChange(currentSegment, nextSegment, atr)) {
            // Add completed trend leg
            if (i - currentLegStart >= MIN_LEG_LENGTH) {
                const legData = data.slice(currentLegStart, i);
                const trendLeg = this.analyzeSingleTrendLeg(legData, currentLegStart, i);
                trendLegs.push(trendLeg);
            }
            currentLegStart = i;
        }
    }

    // Add final trend leg
    if (data.length - currentLegStart >= MIN_LEG_LENGTH) {
        const finalLegData = data.slice(currentLegStart);
        const finalTrendLeg = this.analyzeSingleTrendLeg(
            finalLegData, 
            currentLegStart, 
            data.length - 1
        );
        trendLegs.push(finalTrendLeg);
    }

    return trendLegs;
}

private isTrendChange(
    currentSegment: MarketData[], 
    nextSegment: MarketData[], 
    atr: number
): boolean {
    const currentDirection = this.determineTrendDirection(currentSegment);
    const nextDirection = this.determineTrendDirection(nextSegment);

    // Check for direction change
    if (currentDirection !== nextDirection) {
        // Verify change is significant (> 1 ATR)
        const priceChange = Math.abs(
            nextSegment[nextSegment.length - 1].close - nextSegment[0].close
        );
        return priceChange > atr;
    }

    return false;
}

private analyzeSingleTrendLeg(
    data: MarketData[], 
    startIndex: number, 
    endIndex: number
): TrendLeg {
    const swingPoints = this.findSignificantSwings(data, this.calculateATR(data, 14));
    const priceChange = (data[data.length - 1].close - data[0].close) / data[0].close;
    const momentum = this.calculateMomentum(data);

    // Determine trend direction
    let direction: 'up' | 'down' | 'sideways';
    if (Math.abs(priceChange) < OrderBlockAnalysisService.TREND_PARAMS.priceChangeThreshold) {
        direction = 'sideways';
    } else {
        direction = priceChange > 0 ? 'up' : 'down';
    }

    // Calculate trend strength based on:
    // 1. Price change magnitude
    // 2. Momentum consistency
    // 3. Swing point alignment
    const priceStrength = Math.min(Math.abs(priceChange) * 10, 1); // Scale price change
    const momentumStrength = momentum.strength;
    const swingStrength = this.calculateSwingAlignment(swingPoints, direction);

    const strength = (
        priceStrength * 0.4 +
        momentumStrength * 0.4 +
        swingStrength * 0.2
    ) * 100; // Convert to percentage

    return {
        startIndex,
        endIndex,
        startTime: data[0].time,
        endTime: data[data.length - 1].time,
        direction,
        strength,
        startPrice: data[0].close,
        endPrice: data[data.length - 1].close,
        swingPoints
    };
}

private calculateSwingAlignment(
    swingPoints: SwingPoint[], 
    direction: 'up' | 'down' | 'sideways'
): number {
    if (direction === 'sideways' || swingPoints.length < 2) return 0;

    let aligned = 0;
    let total = 0;

    for (let i = 1; i < swingPoints.length; i++) {
        if (direction === 'up') {
            if (swingPoints[i].price > swingPoints[i - 1].price) aligned++;
        } else {
            if (swingPoints[i].price < swingPoints[i - 1].price) aligned++;
        }
        total++;
    }

    return total > 0 ? aligned / total : 0;
}

private determineTrendDirection(data: MarketData[]): 'up' | 'down' | 'sideways' {
    const priceChange = (data[data.length - 1].close - data[0].close) / data[0].close;
    
    if (Math.abs(priceChange) < OrderBlockAnalysisService.TREND_PARAMS.priceChangeThreshold) {
        return 'sideways';
    }
    return priceChange > 0 ? 'up' : 'down';
}
/**
 * Calculate sequence strength relative to ATR
 */
private calculateSequenceStrength(
    points: SwingPoint[], 
    direction: 'up' | 'down',
    atr: number
): number {
    if (points.length < 2) return 0;

    let validMoves = 0;
    let totalMoves = 0;

    for (let i = 1; i < points.length; i++) {
        const move = direction === 'up' 
            ? points[i].price - points[i-1].price
            : points[i-1].price - points[i].price;

        if (move > 0 && Math.abs(move) > atr * 0.5) {
            validMoves++;
        }
        totalMoves++;
    }

    return totalMoves > 0 ? validMoves / totalMoves : 0;
}

    /**
     * Calculate trend strength (0-1)
     */
    private calculateTrendStrength(
        points: SwingPoint[], 
        direction: 'up' | 'down'
    ): number {
        if (points.length < 2) return 0;

        let increasing = 0;
        let total = 0;

        for (let i = 1; i < points.length; i++) {
            const current = points[i].price;
            const previous = points[i - 1].price;

            if (direction === 'up' && current > previous) increasing++;
            if (direction === 'down' && current < previous) increasing++;
            total++;
        }

        return total > 0 ? increasing / total : 0;
    }
    /**
     * Find order blocks
     */
    private findOrderBlocks(
        data: MarketData[], 
        trend: { direction: 'up' | 'down' | 'none'; strength: number; }
    ): OrderBlock[] {
        const orderBlocks: OrderBlock[] = [];

        // Only proceed if we have a clear trend
        if (trend.direction === 'none' || trend.strength < OrderBlockAnalysisService.ANALYSIS_PARAMS.trendStrengthThreshold) {
            return orderBlocks;
        }

        // Use a sliding window of 7 candles (3 before, current, 3 after)
        for (let i = 3; i < data.length - 3; i++) {
            const window = {
                before: data.slice(i - 3, i),
                current: data[i],
                after: data.slice(i + 1, i + 4)
            };

            // Check for potential order block
            const orderBlock = this.validateOrderBlock(window, trend.direction);
            if (orderBlock) {
                orderBlocks.push(orderBlock);
            }
        }

        return this.filterOverlappingBlocks(orderBlocks);
    }

    /**
     * Validate potential order block
     */
    private validateOrderBlock(
        window: {
            before: MarketData[];
            current: MarketData;
            after: MarketData[];
        },
        trendDirection: 'up' | 'down'
    ): OrderBlock | null {
        const { before, current, after } = window;

        // Check for bullish order block in uptrend
        if (trendDirection === 'up') {
            const isBearishCandle = current.close < current.open;
            const hasImpulsiveMove = this.hasImpulsiveMove(after, 'up');
            const pvg = this.calculatePriceValueGap([...before, current, ...after]);
            
            if (isBearishCandle && hasImpulsiveMove && pvg > OrderBlockAnalysisService.ANALYSIS_PARAMS.minGapSize) {
                return {
                    id: `OB_${current.time}`,
                    type: 'bullish',
                    startTime: current.time,
                    endTime: after[0].time,
                    highPrice: current.high,
                    lowPrice: current.low,
                    volume: current.volume,
                    impulseMagnitude: this.calculateImpulseMagnitude([...before, current, ...after]),
                    priceValueGap: pvg,
                    validationMetrics: {
                        trendAlignment: true,
                        hasBreakOfStructure: this.hasBreakOfStructure([...before, current, ...after], 'up'),
                        gapQuality: this.calculateGapQuality(pvg, current),
                        impulseStrength: this.calculateImpulseStrength(after, before)
                    }
                };
            }
        }

        // Check for bearish order block in downtrend
        if (trendDirection === 'down') {
            const isBullishCandle = current.close > current.open;
            const hasImpulsiveMove = this.hasImpulsiveMove(after, 'down');
            const pvg = this.calculatePriceValueGap([...before, current, ...after]);
            
            if (isBullishCandle && hasImpulsiveMove && pvg > OrderBlockAnalysisService.ANALYSIS_PARAMS.minGapSize) {
                return {
                    id: `OB_${current.time}`,
                    type: 'bearish',
                    startTime: current.time,
                    endTime: after[0].time,
                    highPrice: current.high,
                    lowPrice: current.low,
                    volume: current.volume,
                    impulseMagnitude: this.calculateImpulseMagnitude([...before, current, ...after]),
                    priceValueGap: pvg,
                    validationMetrics: {
                        trendAlignment: true,
                        hasBreakOfStructure: this.hasBreakOfStructure([...before, current, ...after], 'down'),
                        gapQuality: this.calculateGapQuality(pvg, current),
                        impulseStrength: this.calculateImpulseStrength(after, before)
                    }
                };
            }
        }

        return null;
    }

    /**
     * Calculate price value gap
     */
    private calculatePriceValueGap(candles: MarketData[]): number {
        let maxGap = 0;
        
        for (let i = 1; i < candles.length - 1; i++) {
            const current = candles[i];
            const next = candles[i + 1];
            
            // Check for gap between candles
            if (next.low > current.high) {
                maxGap = Math.max(maxGap, next.low - current.high);
            }
            if (next.high < current.low) {
                maxGap = Math.max(maxGap, current.low - next.high);
            }
        }
        
        return maxGap;
    }

    /**
     * Check for impulsive move
     */
    private hasImpulsiveMove(candles: MarketData[], direction: 'up' | 'down'): boolean {
        const moves = candles.map(c => Math.abs(c.close - c.open));
        const avgMove = moves.reduce((sum, move) => sum + move, 0) / moves.length;
        
        if (direction === 'up') {
            return candles[0].close > candles[0].open && 
                   avgMove > OrderBlockAnalysisService.ANALYSIS_PARAMS.minImpulseStrength;
        } else {
            return candles[0].close < candles[0].open && 
                   avgMove > OrderBlockAnalysisService.ANALYSIS_PARAMS.minImpulseStrength;
        }
    }

    /**
     * Calculate impulse magnitude
     */
    private calculateImpulseMagnitude(candles: MarketData[]): number {
        const moves = candles.map(c => ({
            move: Math.abs(c.close - c.open),
            volume: c.volume
        }));
        
        // Volume-weighted average move
        const weightedMoves = moves.map(m => m.move * (m.volume / Math.max(...moves.map(x => x.volume))));
        return weightedMoves.reduce((sum, move) => sum + move, 0) / weightedMoves.length;
    }

    /**
     * Calculate gap quality (0-1)
     */
    private calculateGapQuality(gap: number, candle: MarketData): number {
        const candleSize = Math.abs(candle.high - candle.low);
        return Math.min(gap / candleSize, 1);
    }

    /**
     * Calculate impulse strength
     */
    private calculateImpulseStrength(after: MarketData[], before: MarketData[]): number {
        const afterMoves = after.map(c => Math.abs(c.close - c.open));
        const beforeMoves = before.map(c => Math.abs(c.close - c.open));
        
        const avgAfter = afterMoves.reduce((sum, move) => sum + move, 0) / afterMoves.length;
        const avgBefore = beforeMoves.reduce((sum, move) => sum + move, 0) / beforeMoves.length;
        
        return avgAfter / avgBefore;
    }

    /**
     * Check for break of structure
     */
    private hasBreakOfStructure(candles: MarketData[], direction: 'up' | 'down'): boolean {
        const middle = Math.floor(candles.length / 2);
        const before = candles.slice(0, middle);
        const after = candles.slice(middle);
        
        if (direction === 'up') {
            const beforeHigh = Math.max(...before.map(c => c.high));
            const afterHigh = Math.max(...after.map(c => c.high));
            return afterHigh > beforeHigh;
        } else {
            const beforeLow = Math.min(...before.map(c => c.low));
            const afterLow = Math.min(...after.map(c => c.low));
            return afterLow < beforeLow;
        }
    }

    /**
     * Filter overlapping order blocks
     */
    private filterOverlappingBlocks(blocks: OrderBlock[]): OrderBlock[] {
        return blocks.filter((block, index) => {
            // Check if this block overlaps with any stronger blocks
            const hasStrongerOverlap = blocks.some((otherBlock, otherIndex) => {
                if (index === otherIndex) return false;
                
                const timeOverlap = block.startTime <= otherBlock.endTime && 
                                  block.endTime >= otherBlock.startTime;
                                  
                const priceOverlap = block.lowPrice <= otherBlock.highPrice && 
                                   block.highPrice >= otherBlock.lowPrice;
                                   
                return timeOverlap && priceOverlap && 
                       otherBlock.validationMetrics.impulseStrength > 
                       block.validationMetrics.impulseStrength;
            });
            
            return !hasStrongerOverlap;
        });
    }

    private getTodayMarketOpen(): number {
        const now = new Date();
        return new Date(
            now.getFullYear(), 
            now.getMonth(), 
            now.getDate(), 
            OrderBlockAnalysisService.MARKET_HOURS.start.hour, 
            OrderBlockAnalysisService.MARKET_HOURS.start.minute
        ).getTime();
    }

    private getTodayMarketClose(): number {
        const now = new Date();
        return new Date(
            now.getFullYear(), 
            now.getMonth(), 
            now.getDate(), 
            OrderBlockAnalysisService.MARKET_HOURS.end.hour, 
            OrderBlockAnalysisService.MARKET_HOURS.end.minute
        ).getTime();
    }

   
}

export type { AnalysisResult, OrderBlock, SwingPoint };