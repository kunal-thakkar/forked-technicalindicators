/**
 * Created by AAravindan on 5/5/16.
 */

import { CandleData } from '../index';
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { AverageGain } from '../Utils/AverageGain';
import { AverageLoss } from '../Utils/AverageLoss';

export class RSIInput extends IndicatorInput {
  period: number;
  values: CandleData[];
}

export class RSI extends Indicator {
  period: number;
  constructor(input:RSIInput) {
    super(input);
    this.period = input.period;
    var values = input.values;

    var GainProvider = new AverageGain({ period: this.period, values: [] });
    var LossProvider = new AverageLoss({ period: this.period, values: [] });
    let count = 1;
    this.generator = (function* (period){
      var current: CandleData = yield;
      var lastAvgGain,lastAvgLoss, RS, currentRSI;
      while(true){
        lastAvgGain = GainProvider.nextValue(current);
        lastAvgLoss = LossProvider.nextValue(current);
        if((lastAvgGain!==undefined) && (lastAvgLoss!==undefined)){
          if(lastAvgLoss === 0){
            currentRSI = 100;
          } else if(lastAvgGain === 0 ) { 
            currentRSI = 0;
          } else {
            RS = lastAvgGain / lastAvgLoss;
            RS = isNaN(RS) ? 0 : RS;
            currentRSI = parseFloat((100 - (100 / (1 + RS))).toFixed(2));
          }
        }
        count++;
        current = yield currentRSI;
      }
    })(this.period);

    this.generator.next();

    this.result = [];

    values.forEach((tick) => {
      var result = this.generator.next(tick);
      if(result.value !== undefined){
        this.result.push(result.value);
      }
    });
  };

  static calculate = rsi;

  override nextValue(price:CandleData):number | undefined {
    return this.generator.next(price).value;
  };
}

export function rsi(input:RSIInput):number[] {
       Indicator.reverseInputs(input);
        var result = new RSI(input).result;
        if(input.reversedInput) {
            result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
    };
