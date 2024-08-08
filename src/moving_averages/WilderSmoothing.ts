import { MAInput } from './SMA';
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { LinkedList } from '../Utils/LinkedList';
import { CandleData } from '../index';

//STEP3. Add class based syntax with export
export class WilderSmoothing extends Indicator{
    period:number;
    price:CandleData[];
    constructor(input:MAInput) {
        super(input);
        this.period  = input.period;
        this.price = input.values;
        var genFn = (function*(period:number):Generator<number | undefined, number|boolean|undefined, CandleData> {
            var list = new LinkedList();
            var sum = 0;
            var counter = 1;
            var current: CandleData = yield;
            var result: number | undefined = 0;
            while(true){
                if(counter < period){
                    counter ++;
                    sum = sum + current.close!;
                    result = undefined;
                } else if(counter == period){
                    counter ++;
                    sum = sum + current.close!;
                    result = sum;
                }
                else{
                    result = result! - (result! / period) + current.close!;
                }
                current = yield result;
            }
        });
        this.generator = genFn(this.period);
        this.generator.next();
        this.result = [];
        this.price.forEach((tick) => {
            var result = this.generator.next(tick);
            if(result.value != undefined){
                this.result.push(this.format(result.value));
            }
        });
    }
    
    static calculate = wildersmoothing;

    override nextValue(price:CandleData):number | undefined {
        var result = this.generator.next(price).value;
        return (result != undefined) ? this.format(result) : undefined;
    };
}

export function wildersmoothing(input:MAInput):number[] {
    Indicator.reverseInputs(input);
    var result = new WilderSmoothing(input).result;
    if(input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
};

//STEP 6. Run the tests