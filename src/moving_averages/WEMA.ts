import { Indicator, IndicatorInput } from '../indicator/indicator';
import { MAInput, SMA } from './SMA';
import { LinkedList } from '../Utils/LinkedList';
import { CandleData } from '../index';

export class WEMA extends Indicator{
    period:number;
    price:CandleData[];
    constructor(input:MAInput) {
        super(input);
        var period = input.period
        var priceArray = input.values;
        var exponent = 1 / period;
        var sma:SMA;

        this.result = [];

        sma = new SMA({period : period, values :[]});

        var genFn = (function* (): Generator<number | undefined, number|boolean|undefined, CandleData>{
            var tick: CandleData  = yield;
            var prevEma;
            while (true) {
                if(prevEma !== undefined && tick !== undefined){
                    prevEma = ((tick.close! - prevEma) * exponent) + prevEma;
                    tick = yield prevEma;
                }else {
                    tick = yield;
                    prevEma = sma.nextValue(tick)
                    if(prevEma !== undefined)
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

    static calculate = wema;

    override nextValue(price:CandleData):number | undefined {
        var result = this.generator.next(price).value;
        return (result != undefined) ? this.format(result) : undefined;
    };
}

export function wema(input:MAInput):number[] {
      Indicator.reverseInputs(input);
      var result = new WEMA(input).result;
      if(input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  }
