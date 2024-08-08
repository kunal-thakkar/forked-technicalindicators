import { CandleData } from '../index';
import { IndicatorInput, Indicator } from '../indicator/indicator';

import LinkedList from '../Utils/FixedSizeLinkedList';

export class WilliamsRInput extends IndicatorInput {
  low:number[];
  high:number[];
  close:number[];
  period:number;
};

export class WilliamsR extends Indicator {
  constructor(input:WilliamsRInput) {
    super(input);
    let lows = input.low;
    let highs = input.high;
    let closes = input.close;
    let period = input.period;
    let format = this.format;

    if(!((lows.length === highs.length) && (highs.length === closes.length) )){
      throw ('Inputs(low,high, close) not of equal size');
    }
    this.result = [];

    //%R = (Highest High - Close)/(Highest High - Lowest Low) * -100
    //Lowest Low = lowest low for the look-back period
    //Highest High = highest high for the look-back period
    //%R is multiplied by -100 correct the inversion and move the decimal.
    this.generator = (function* ():Generator<number | undefined, number|undefined, CandleData>{
      let index = 1;
      let pastHighPeriods = new LinkedList(period, true, false);
      let pastLowPeriods = new LinkedList(period, false, true);
      let periodLow;
      let periodHigh;
      var tick: CandleData = yield;
      let williamsR;
      while (true) {
        pastHighPeriods.push(tick.high);
        pastLowPeriods.push(tick.low);
        if(index < period){
          index++;
          tick = yield;
          continue;
        }
        periodLow = pastLowPeriods.periodLow;
        periodHigh= pastHighPeriods.periodHigh;
        williamsR = format((periodHigh - tick.close!) / (periodHigh- periodLow) * -100);
        tick = yield williamsR;
      }
    })();

    this.generator.next();

    lows.forEach((low, index) => {
      var result = this.generator.next({
        high : highs[index],
        low  : lows[index],
        close : closes[index]
      });
      if(result.value !== undefined){
        this.result.push(result.value);
      }
    });
  };

  static calculate = williamsr;

  override nextValue(price:CandleData):number | undefined {
      var nextResult = this.generator.next(price);
      return (nextResult.value != undefined) ? this.format(nextResult.value) : undefined;
  };
}

export function williamsr(input:WilliamsRInput):number[] {
      Indicator.reverseInputs(input);
      var result = new WilliamsR(input).result;
      if(input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  };