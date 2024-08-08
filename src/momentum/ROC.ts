import { CandleData } from '../index';
import { Indicator, IndicatorInput } from '../indicator/indicator';
import LinkedList from '../Utils/FixedSizeLinkedList';


export class ROCInput extends IndicatorInput {
  period : number;
  values : CandleData[];
} 

export class ROC extends Indicator {
  constructor(input:ROCInput) {
      super(input);
      var period = input.period
      var priceArray = input.values;
      this.result = [];
      this.generator = (function* (){
        let index = 1;
        var pastPeriods = new LinkedList(period);;
        var tick: CandleData = yield;
        var roc;
        while (true) {
          pastPeriods.push(tick)
          if(index < period){
            index++;
          }else {
            roc = ((tick.close! - pastPeriods.lastShift) / (pastPeriods.lastShift)) * 100
          }
          tick = yield roc;
        }
      })();

      this.generator.next();

      priceArray.forEach((tick) => {
        var result = this.generator.next(tick);
        if(result.value != undefined && (!isNaN(result.value))){
          this.result.push(this.format(result.value));
        }
      });
  }

   static calculate = roc;

   override nextValue(price:CandleData):number | undefined {
      var nextResult = this.generator.next(price);
      return (nextResult.value != undefined && (!isNaN(nextResult.value))) ? this.format(nextResult.value) : undefined;
    };

};


export function roc(input:ROCInput):number[] {
       Indicator.reverseInputs(input);
        var result = new ROC(input).result;
        if(input.reversedInput) {
            result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
    };