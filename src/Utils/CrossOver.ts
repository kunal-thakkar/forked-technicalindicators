import {Indicator, IndicatorInput} from '../indicator/indicator';
import {CrossUp} from './CrossUp';
import {CrossDown} from './CrossDown';

export class CrossInput extends IndicatorInput {
    constructor(public lineA: number[], public lineB: number[]) {
        super();
    }
}

export class CrossOver extends Indicator {
    constructor(input: CrossInput) {
        super(input);

        var crossUp = new CrossUp({lineA: input.lineA, lineB: input.lineB});
        var crossDown = new CrossDown({lineA: input.lineA, lineB: input.lineB});

        const genFn = (function* (): Generator<true | false, any, any> {
            var current: {valueA: number, valueB: number} = yield;
            var result = false;
            var first = true;

            while (true) {
                var nextUp = crossUp._nextValue(current.valueA, current.valueB);
                var nextDown = crossDown._nextValue(current.valueA, current.valueB);

                result = nextUp || nextDown;

                if (first) result = false;
                first = false;
                current = yield result;
            }
        });

        this.generator = genFn();
        this.generator.next();

        var resultA = crossUp.getResult();
        var resultB = crossDown.getResult();

        this.result = resultA.map((a, index) => {
            if (index === 0) return false;
            return !!(a || resultB[index]);
        })
    }

    static calculate = crossOver;

    static override reverseInputs(input: CrossInput): void {
        if (input.reversedInput) {
            input.lineA ? input.lineA.reverse() : undefined;
            input.lineB ? input.lineB.reverse() : undefined;
        }
    }

    _nextValue(valueA: number, valueB: number): true | false {
        return this.generator.next({
            valueA: valueA,
            valueB: valueB
        }).value;
    };
}

export function crossOver(input: CrossInput): boolean[] {
    Indicator.reverseInputs(input);
    var result = new CrossOver(input).result;
    if (input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
}
