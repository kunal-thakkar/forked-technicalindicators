
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { SMA } from '../moving_averages/SMA'
import { CandleData } from '../StockData';

export class AwesomeOscillatorInput extends IndicatorInput {
  high:number[]
  low:number[]
  fastPeriod :number
  slowPeriod :number
}

export class AwesomeOscillator extends Indicator {
    constructor (input:AwesomeOscillatorInput) {
      super(input);
      var highs       = input.high;
      var lows        = input.low;
      var fastPeriod  = input.fastPeriod;
      var slowPeriod  = input.slowPeriod;

      var slowSMA = new SMA({ values : [], period : slowPeriod })
      var fastSMA = new SMA({ values : [], period : fastPeriod })

      this.result = [];

      this.generator = (function* (){
        var result;
        var tick;
        var medianPrice;
        var slowSmaValue;
        var fastSmaValue;
        tick = yield;
        while (true)
        {

          medianPrice = (tick.high + tick.low) / 2
          slowSmaValue = slowSMA.nextValue({close:medianPrice});
          fastSmaValue = fastSMA.nextValue({close:medianPrice});
          if(slowSmaValue !== undefined && fastSmaValue !== undefined) {
            result = fastSmaValue - slowSmaValue;
          }
          tick = yield result
        }
      })();

      this.generator.next();

      highs.forEach((tickHigh, index) => {
        var tickInput = {
          high    : tickHigh,
          low     : lows[index],
        }
        var result = this.generator.next(tickInput);
        if(result.value != undefined){
          this.result.push(this.format(result.value));
        }
      });
  };

  static calculate = awesomeoscillator;

  override nextValue(price:CandleData):number | undefined {
    var result =  this.generator.next(price);
    return (result.value != undefined) ? this.format(result.value) : undefined;
  };
}

export function awesomeoscillator(input:AwesomeOscillatorInput):number[] {
      Indicator.reverseInputs(input);
      var result = new AwesomeOscillator(input).result;
      if(input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  };
