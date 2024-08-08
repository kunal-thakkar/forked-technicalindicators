import { Indicator, IndicatorInput } from '../indicator/indicator';
import { MAInput, SMA } from './SMA';
import { LinkedList } from '../Utils/LinkedList';
import { CandleData } from '../index';

export class EMA extends Indicator{
    period:number;
    price:number[];
    constructor(input:MAInput) {
        super(input);
        var period = input.period
        var priceArray = input.values;
        var exponent = (2 / (period + 1));
        var sma:SMA;

        this.result = [];

        sma = new SMA({period : period, values :[]});

        var genFn = (function* ():Generator<number | undefined, number|undefined, CandleData>{
            var tick: CandleData = yield;
            var prevEma;
            while (true) {
                if(prevEma !== undefined && tick !== undefined){
                    prevEma = ((tick.close! - prevEma) * exponent) + prevEma;
                    tick = yield prevEma;
                }else {
                    tick = yield;
                    prevEma = sma.nextValue(tick)
                    if(prevEma)
                        tick = yield prevEma;
                }
            }
        });

        this.generator = genFn();

        this.generator.next();
        this.generator.next();

        priceArray.forEach((tick) => {
            var result = this.generator.next(tick);
            if(result.value != undefined){
                this.result.push(this.format(result.value));
            }
        });
    }

    static calculate = ema;

    override nextValue(price:CandleData): number | undefined {
        var result = this.generator.next(price).value;
        return (result != undefined) ? this.format(result) : undefined;
    };
}

export function ema(input:MAInput):number[] {
        Indicator.reverseInputs(input);
        var result = new EMA(input).result;
        if(input.reversedInput) {
            result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
    }
