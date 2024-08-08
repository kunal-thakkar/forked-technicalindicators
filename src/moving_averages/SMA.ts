//STEP 1. Import Necessary indicator or rather last step
import { CandleData } from '../index';
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { LinkedList } from '../Utils/LinkedList';

//STEP 2. Create the input for the indicator, mandatory should be in the constructor
export class MAInput extends IndicatorInput {
    constructor(public period:number, 
                public values:CandleData[]) {
        super();
    }
}

//STEP3. Add class based syntax with export
export class SMA extends Indicator{
    period:number;
    price:CandleData[];
    constructor(input:MAInput) {
        super(input);
        this.period  = input.period;
        this.price = input.values;
        var genFn = (function*(period:number):Generator<number | undefined, number|boolean, CandleData> {
            var list = new LinkedList();
            var sum = 0;
            var counter = 1;
            var current: CandleData = yield;
            var result;
            list.push(0);
            while(true){
                if(counter < period){
                    counter ++;
                    list.push(current.close);
                    sum = sum + current.close!;
                }
                else{
                    sum = sum - list.shift() + current.close!;
                    result = ((sum) / period);
                    list.push(current.close);
                }
                current = yield result;
            }
        });
        this.generator = genFn(this.period);
        this.generator.next();
        this.result = [];
        this.price.forEach((tick: CandleData) => {
            var result = this.generator.next(tick);
            if(result.value !== undefined){
                this.result.push(this.format(result.value));
            }
        });
    }
    override name(): string {
        return "SMA-"+this.period;
    }
    static calculate = sma;

    override nextValue(price:CandleData):number | undefined {
        var result = this.generator.next(price).value;
        return (result != undefined) ? this.format(result) : undefined;
    };
}

export function sma(input:MAInput):number[] {
    Indicator.reverseInputs(input);
    var result = new SMA(input).result;
    if(input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
};

//STEP 6. Run the tests