/**
 * Created by AAravindan on 5/9/16.
 */
"use strict"

import { ROC } from './ROC.js';
import { EMA } from '../moving_averages/EMA.js';
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { CandleData } from '../index';

export class TRIXInput extends IndicatorInput{
  values:CandleData[];
  period:number;
};

export class TRIX extends Indicator {
  constructor(input:TRIXInput) {
    super(input);
    let priceArray  = input.values;
    let period      = input.period;
    let format = this.format;

    let ema              = new EMA({ period : period, values : [], format : (v) => {return v}});
    let emaOfema         = new EMA({ period : period, values : [], format : (v) => {return v}});
    let emaOfemaOfema    = new EMA({ period : period, values : [], format : (v) => {return v}});
    let trixROC          = new ROC({ period : 1, values : [], format : (v) => {return v}});

    this.result = [];

    this.generator = (function* ():Generator< number | undefined, number|undefined, CandleData>{
      let tick = yield;
      while (true) {
        let initialema           = ema.nextValue(tick);
        let smoothedResult       = initialema ? emaOfema.nextValue({close:initialema}) : undefined;
        let doubleSmoothedResult = smoothedResult ? emaOfemaOfema.nextValue({close:smoothedResult}) : undefined;
        let result               = doubleSmoothedResult ? trixROC.nextValue({close:doubleSmoothedResult}) : undefined;
        tick = yield result ? format(result) : undefined;
      }
    })();

    this.generator.next();

    priceArray.forEach((tick) => {
      let result = this.generator.next(tick);
      if(result.value !== undefined){
        this.result.push(result.value);
      }
    });
  }
    
    static calculate=trix;

    override nextValue(price:CandleData): number|undefined {
      let nextResult = this.generator.next(price);
      return nextResult.value;
    };
} 

export function trix(input:TRIXInput):number[] {
    Indicator.reverseInputs(input);
    var result = new TRIX(input).result;
    if(input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
};  
