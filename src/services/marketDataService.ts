// src/services/marketDataService.ts
import { error, time } from "console";
import { MarketDataStorage } from "./marketDataStorage";
import { TFile } from "obsidian";
import dotenv from 'dotenv';
// Initialize dotenv
dotenv.config();

// Create a config object to manage environment variables
const config = {
    primaryApiKey: process.env.ALPHA_VANTAGE_PRIMARY_KEY,
    secondaryApiKey: process.env.ALPHA_VANTAGE_SECONDARY_KEY,
    cacheDuration: parseInt(process.env.MARKET_DATA_CACHE_DURATION || '86400000'),
    timezone: process.env.TIMEZONE || 'US/Eastern',
    
    // Validate environment variables
    validate() {
        if (!this.primaryApiKey) {
            throw new Error('ALPHA_VANTAGE_PRIMARY_KEY is not set in environment variables');
        }
        if (!this.secondaryApiKey) {
            throw new Error('ALPHA_VANTAGE_SECONDARY_KEY is not set in environment variables');
        }
    }
};


export interface MarketData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    sma?: number;  // Simple Moving Average
    ema?: number;  // Exponential Moving Average
    rsi?: number;  // Relative Strength Index
}
export interface MarketDataCache {
    data: MarketData[];
    timestamp: number;
}
export interface MarketHours {
    start: number;  // 4:00 AM ET
    end: number;    // 19:59 PM ET
    timeZone: string; // 'America/New_York'
}
export type IntervalType = '1min' | '5min' | '15min' | '30min' | '60min' | 'daily';

export interface TimeframeConfig {
    interval: IntervalType;
    startTime: number;
    endTime: number;
}

export interface CacheEntry {
    data: MarketData[];
    timestamp: number;
    interval: IntervalType;
    startTime: number;
    endTime: number;
    timezone:string;
}

export interface CacheMetadata {
    [symbol: string]: {
        [interval in IntervalType]?: CacheEntry[];
    };
}
export class MarketDataService {
    static async fetchHistoricalData(
        symbol: string, 
        outputsize: 'full' | 'compact' = 'full'
    ): Promise<{data:MarketData[],timezone: string}> {
        // Validate environment variables
        config.validate();
        
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${config.primaryApiKey}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();

            // Check for API errors
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }

            const timezone = data['Meta Data']['6. Time Zone'];
            const timeSeries = data['Time Series (Daily)'];
            
            const marketData= Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
                time: new Date(date).getTime(),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'])
            })).reverse();
            return{data:marketData,timezone}
        } catch (error) {
            console.error('Error fetching historical data:', error);
            throw error;
        }
    }

    static async fetchIntraday(
        symbol: string,
        interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
    ): Promise<{data: MarketData[], timezone: string }> {
        // Validate environment variables
        config.validate();
        
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=full&apikey=${config.secondaryApiKey}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();

                // Check for rate limit message
       /* if (data.Information && data.Information.includes('rate limit')) {
            throw new Error('API rate limit reached. Please try again in a minute.');
        }*/
              // Log full response to see structure
        console.log('Alpha Vantage Response:', data);
        
                // Method 1: Log all top-level keys
                console.log('Top level keys:', Object.keys(data));
            const timezone = data['Meta Data']['5. Time Zone'];
            const timeSeriesKey = `Time Series (${interval})`;
            const timeSeries = data[timeSeriesKey];
            
            if (!timeSeries) {
                throw new Error('No data returned from API.  You may have exceeded the daily limit.');
            }

            const marketData= Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
                time: new Date(date).getTime(),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'])
            })).reverse();

            return { data: marketData, timezone}
        } catch (error) {
            console.error('Error fetching intraday data:', error);
            throw error;
            //For when we want to hide implementation details
            //throw new Error('Unable to fetch intraday data. Please try again later.');
        }
    }
    static readonly MARKET_HOURS: MarketHours = {
        start: 4 * 60,    // 4:00 AM in minutes
        end: 20 * 60 - 1, // 19:59 PM in minutes
        timeZone: config.timezone
    };

    // Add method for getting multiple timeframes in one call
    static async fetchMultiTimeframe(
        symbol: string,
        timeframes: Array<'1min' | '5min' | '15min' | '30min' | '60min' | 'daily'>
    ): Promise<Record<string, MarketData[]>> {
        try {
            const results: Record<string, MarketData[]> = {};
            
            await Promise.all(
                timeframes.map(async (timeframe) => {
                    if (timeframe === 'daily') {
                        results[timeframe] = (await this.fetchHistoricalData(symbol)).data;
                    } else {
                        data:results[timeframe] = (await this.fetchIntraday(symbol, timeframe)).data;
                    }
                })
            );

            return results;
        } catch (error) {
            console.error('Error fetching multiple timeframes:', error);
            throw error;
        }
    }
    private static INTERVALS_MINUTES = {
        '1min': 1,
        '5min': 5,
        '15min': 15,
        '30min': 30,
        '60min': 60,
        'daily': 1440
    };

 
   

    private static adjustTimeEndRequest(timestamp: number): number {
        const date = new Date(timestamp);
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday
        const hours = date.getHours();
        const minutes = date.getMinutes();
    
        // If weekend, adjust to Friday
        if (day === 1&&hours<9) {date.setDate(date.getDate() - 3);date.setHours(19, 59, 0, 0);} // Monday -> Friday            
        if (day === 0) {date.setDate(date.getDate() - 2); date.setHours(19, 59, 0, 0);} // Sunday -> Friday 
        if (day === 6) {date.setDate(date.getDate() - 1);date.setHours(19, 59, 0, 0);} // Saturday -> Friday
        
        // Set to 16:00 (4 PM) ET if after market close
        if (hours > 19|| hours<4 ) {
            date.setHours(19, 59, 0, 0);
            date.setDate(date.getDate() - hours<4?1:0);
        }
        return date.getTime();
    }
    private static doesCacheCover(cache: CacheEntry, request: TimeframeConfig): boolean {

    // If cache's last data point is within 24 hours, consider it current
        const adjustedEndTime = this.adjustTimeEndRequest(
            cache.endTime +24*60*60*1000>= request.endTime ? cache.endTime : request.endTime
        );
        console.log('Request Time:', {
            
            Time: new Date(adjustedEndTime).toLocaleString()
        });
        return cache.interval === request.interval &&
               cache.startTime <= request.startTime &&
               cache.endTime >= adjustedEndTime;
    }
    private static aggregateToHigherTimeframe(
        data: MarketData[],
        fromInterval: IntervalType,
        toInterval: IntervalType
    ): MarketData[] {
        const fromMinutes = this.INTERVALS_MINUTES[fromInterval];
        const toMinutes = this.INTERVALS_MINUTES[toInterval];
        const barsPerPeriod = toMinutes / fromMinutes;
    
        // Group data into higher timeframe periods
        const groupedData: { [key: number]: MarketData[] } = {};
        data.forEach(bar => {
            const periodStart = Math.floor(bar.time / (toMinutes * 60 * 1000)) * (toMinutes * 60 * 1000);
            if (!groupedData[periodStart]) {
                groupedData[periodStart] = [];
            }
            groupedData[periodStart].push(bar);
        });
    
        // Aggregate each period
        return Object.entries(groupedData)
            .filter(([_, bars]) => bars.length >= barsPerPeriod * 0.7) // Require at least 70% of bars
            .map(([time, bars]) => ({
                time: parseInt(time),
                open: bars[0].open,
                high: Math.max(...bars.map(b => b.high)),
                low: Math.min(...bars.map(b => b.low)),
                close: bars[bars.length - 1].close,
                volume: bars.reduce((sum, b) => sum + b.volume, 0)
            }));
    }
    
    static addMarketTime(time: number, minutesToAdd: number): number {
        let date = new Date(time);
        let currentMinutes = date.getHours() * 60 + date.getMinutes();
        let newMinutes = currentMinutes + minutesToAdd;
    
        // If would exceed market close
        if (newMinutes > this.MARKET_HOURS.end) {
            // Move to next day at market open
            date.setDate(date.getDate() + 1);
            date.setHours(this.MARKET_HOURS.start/60, 0, 0, 0);
            
            // If weekend, move to Monday
            while (date.getDay() === 0 || date.getDay() === 6) {
                date.setDate(date.getDate() + 1);
            }
        } else {
            // Stay on same day, just update time
            date.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
        }
    
        return date.getTime();
    }
    static async getMarketData(
        symbol: string,
        config: TimeframeConfig,
        storage: MarketDataStorage
    ): Promise<MarketData[]> {
        console.log('Request Config:', {
            symbol,
            interval: config.interval,
            startTime: new Date(config.startTime).toLocaleString(),
            endTime: new Date(config.endTime).toLocaleString()
        });
        try{
           // Get all cache entries for this symbol/interval
    const cacheEntries = await storage.getMarketData(symbol, config.interval);
    console.log(`Found ${cacheEntries.length} cache entries`);
        //console.log(`Checking cache for ${symbol} ${config.interval} data...`);
const overlappingEntries = cacheEntries.filter(cache => 
                // Entry ends after request starts AND entry starts before request ends
                this.addMarketTime(cache.endTime,1) >= config.startTime && cache.startTime <= this.addMarketTime(config.endTime,1)
            );
        if (cacheEntries.length > 0) {
            // Find overlapping cache entries
            
    
        /*
          console.log('Found overlapping cache entries:', overlappingEntries.map(cache => ({
            startTime: new Date(cache.startTime).toLocaleString(),
            endTime: new Date(cache.endTime).toLocaleString(),
            dataPoints: cache.data.length
        })));*/
        
        // Check if any single cache entry covers our request
        const coveringEntry =overlappingEntries.find(cache => this.doesCacheCover(cache, config))
        
        if(coveringEntry) {
                console.log('Found complete coverage in cache:', {
                    start: new Date(coveringEntry.startTime).toLocaleString(),
                    end: new Date(coveringEntry.endTime).toLocaleString()
                });
                return coveringEntry.data.filter(d => 
                    d.time >= config.startTime && d.time <= config.endTime
                );
        }
        console.log(`Found ${overlappingEntries.length} overlapping entries but no complete coverage`);
    }
        console.log(`Cache miss for ${symbol} ${config.interval}, fetching from API...`);
        // Check if we can build from lower timeframe data
        const intervals = Object.keys(this.INTERVALS_MINUTES) as IntervalType[];
        const lowerIntervals = intervals.filter(interval => 
            this.canDeriveFromCache(interval, config.interval)
        );
    
        for (const interval of lowerIntervals) {
            const lowerCacheEntries = await storage.getMarketData(symbol, interval);
            // Find overlapping entries from lower timeframe
    const overlappingEntries = lowerCacheEntries.filter(cache => 
        cache.endTime >= config.startTime && cache.startTime <= config.endTime
    );

    // Check if we have complete coverage from lower timeframe
    const hasFullCoverage = overlappingEntries.some(cache => 
        this.doesCacheCover(cache, {
            ...config,
            interval: interval
        })
    );

    if (hasFullCoverage) {
        // Merge overlapping lower timeframe data
        const mergedLowerData = overlappingEntries.reduce((acc, cache) => 
            [...acc, ...cache.data], [] as MarketData[]
        ).sort((a, b) => a.time - b.time);

        // We can build the higher timeframe from this data
        const aggregatedData = this.aggregateToHigherTimeframe(
            mergedLowerData,
            interval,
            config.interval
        );

        // Cache the aggregated data
        await storage.saveMarketData(symbol, {
            data: aggregatedData,
            timestamp: Date.now(),
            interval: config.interval,
            startTime: Math.min(...aggregatedData.map(d => d.time)),
            endTime: Math.max(...aggregatedData.map(d => d.time)),
            timezone: overlappingEntries[0].timezone, // Assume timezone is consistent
        });
    
        return aggregatedData.filter(d =>
            d.time >= config.startTime && d.time <= config.endTime
        );
    }
}
            // If we can't build from cache, fetch new data
    const {data, timezone} = await this.fetchAppropriateData(symbol, config);
    let mergedData = data;
      // If we have existing cached data, try to merge
      if (cacheEntries.length > 0) {
        
        if (overlappingEntries.length > 0) {
            console.log('Attempting to merge with cached data');
            mergedData = this.mergeMarketData(
                overlappingEntries.reduce((acc, cache) => [...acc, ...cache.data], [] as MarketData[]),
                data);
    
                console.log('Merged with overlapping cached data:', {
                    overlappingCachePoints: overlappingEntries.reduce((sum, cache) => sum + cache.data.length, 0),
                    newPoints: data.length,
                    finalPoints: mergedData.length
                });
            }
        }
        const newStartTime = Math.min(...mergedData.map(d => d.time));
        const newEndTime = Math.max(...mergedData.map(d => d.time));
        
        // Check if this exact time range already exists in cache
        const exactMatch = overlappingEntries.some(entry => 
            Math.abs(entry.startTime - newStartTime) < 60000 && // Within 1 minute
            Math.abs(entry.endTime - newEndTime) < 60000 &&     // Within 1 minute
            entry.interval === config.interval
        );

if (!exactMatch) {
        await storage.saveMarketData(symbol, {
            data: mergedData,
            timestamp: Date.now(),
            interval: config.interval,
            startTime: Math.min(...mergedData.map(d => d.time)),
            endTime: Math.max(...mergedData.map(d => d.time)),
            timezone
        });
    } else {
        console.log('Skipping cache save - exact time range already exists');
    }

        return mergedData;
    }
  catch (error) {
    console.error('Error in getMarketData:', error);
    throw error; // Re-throw to handle in component
}

}
    private static canDeriveFromCache(sourceInterval: IntervalType, targetInterval: IntervalType): boolean {
        const sourceMinutes = this.INTERVALS_MINUTES[sourceInterval];
        const targetMinutes = this.INTERVALS_MINUTES[targetInterval];
        return sourceMinutes < targetMinutes && targetMinutes % sourceMinutes === 0;
    }


    private static async fetchAppropriateData(
        symbol: string, 
        config: TimeframeConfig
    ): Promise<{data:MarketData[], timezone: string}> {
        if (config.interval === 'daily') {
            return await this.fetchHistoricalData(symbol);
        } else {
            return await this.fetchIntraday(symbol, config.interval);
        }
    }
    private static mergeMarketData(existingData: MarketData[], newData: MarketData[]): MarketData[] {
        // Combine both arrays
        const combined = [...existingData, ...newData];
        
        // Sort by time
        combined.sort((a, b) => a.time - b.time);
        
        // Remove duplicates based on timestamp
        return combined.filter((item, index, self) =>
            index === 0 || item.time !== self[index - 1].time
        );
    }
}



