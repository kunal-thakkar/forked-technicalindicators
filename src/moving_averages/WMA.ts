"use strict"
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { MAInput } from './SMA';
import { LinkedList } from '../Utils/LinkedList';
import { CandleData } from '../index';

export class WMA extends Indicator{
  period:number;
  price:number[];
  constructor (input:MAInput) {
    super(input);
    var period = input.period;
    var priceArray = input.values;
    this.result = [];
    this.generator = (function* (){
      let data = new LinkedList();
      let denominator = period * (period + 1)/2;

      while (true) {
        if((data.length) < period ){
          data.push(yield)
        }else {
          data.resetCursor();
          let result = 0;
          for(let i=1; i<=period; i++){
            result = result + (data.next() * i/(denominator))
          }
          var next = yield result;
          data.shift();
          data.push(next);
        }
      }
    })();

    this.generator.next();

    priceArray.forEach((tick, index) => {
      var result = this.generator.next(tick)
      if(result.value != undefined){
        this.result.push(this.format(result.value));
      }
    });
  }

  static calculate = wma;

    //STEP 5. REMOVE GET RESULT FUNCTION
  override nextValue(price:CandleData):number | undefined {
    var result = this.generator.next(price.close!).value;
    return (result != undefined) ? this.format(result) : undefined;
  };

};

export function wma(input:MAInput):number[] {
      Indicator.reverseInputs(input);
      var result = new WMA(input).result;
      if(input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  }
