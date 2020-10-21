/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {clamp} from '@react-aria/utils';
import {NumberFieldProps} from '@react-types/numberfield';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useControlledState} from '@react-stately/utils';
import {useNumberFormatter, useNumberParser} from '@react-aria/i18n';

export interface NumberFieldState {
  setValue: (val: number | string) => void,
  increment: () => void,
  decrement: () => void,
  incrementToMax: () => void,
  decrementToMin: () => void,
  commitInputValue: () => void,
  value: number,
  inputValue: string,
  textValue?: string,
  currentNumeralSystem?: string
}

let numberingSystems = {
  arab: [...('٠١٢٣٤٥٦٧٨٩')],
  hanidec: [...('〇一二三四五六七八九')],
  latin: [...('0123456789')]
};

const CURRENCY_SIGN_REGEX = new RegExp('^\\(.*\\)$');

export function useNumberFieldState(
  props: NumberFieldProps
): NumberFieldState {
  let {minValue = Number.MIN_SAFE_INTEGER, maxValue = Number.MAX_SAFE_INTEGER, step, formatOptions, value, defaultValue, onChange} = props;
  let [currentNumeralSystem, setCurrentNumeralSystem] = useState('latin');

  let numberParser = useNumberParser();
  let inputValueFormatter = useNumberFormatter(formatOptions);

  let isMaxRange = useMemo(() => minValue === Number.MIN_SAFE_INTEGER && maxValue === Number.MAX_SAFE_INTEGER, [minValue, maxValue]);

  let symbols = useMemo(() => {
    // Get the minus sign of the current locale to filter the input value
    // Automatically updates the minus sign when numberFormatter changes
    // won't work for currency accounting, but we have validCharacters for that in the pattern
    let allParts = inputValueFormatter.formatToParts(-1000.1);
    let posAllParts = inputValueFormatter.formatToParts(1000.1);
    let minusSign = allParts.find(p => p.type === 'minusSign')?.value;
    let plusSign = posAllParts.find(p => p.type === 'plusSign')?.value;
    minusSign = minValue >= 0 || !minusSign ? '' : minusSign;
    plusSign = maxValue <= 0 || !plusSign ? '' : plusSign;
    let decimal = allParts.find(p => p.type === 'decimal')?.value;
    // this is a string ready for any regex so we can identify allowed characters, minus is excluded because of the way it can be handled
    let validCharacters = allParts.reduce((chars, p) => p.type === 'fraction' || p.type === 'integer' || p.type === 'minusSign' || p.type === 'plusSign' ? chars : chars + '\\' + p.value, '');
    let literals = allParts.reduce((chars, p) => p.type === 'decimal' || p.type === 'fraction' || p.type === 'integer' || p.type === 'minusSign' || p.type === 'plusSign' ? chars : chars + '\\' + p.value, '');
    return {minusSign, plusSign, decimal, validCharacters, literals};
  }, [inputValueFormatter, minValue, maxValue]);
  let {minusSign, plusSign, decimal, validCharacters, literals} = symbols;

  // javascript doesn't recognize NaN === NaN, so multiple onChanges will get fired if we don't ignore consecutive ones
  // in addition, if the input starts with a number, then we'll count that as the last val dispatched, we only need to calculate it the first time
  let startingValue = useMemo(() => {
    if(!isNaN(value)) {
      return value;
    } else if (!isNaN(defaultValue)) {
      return defaultValue;
    }
    return NaN;
  }, []);
  let lastValDispatched = useRef(startingValue);
  let smartOnChange = useCallback((val) => {
    if (!isNaN(val) || !isNaN(lastValDispatched.current)) {
      onChange?.(val);
    }
    lastValDispatched.current = val;
  }, [lastValDispatched]);
  let [numberValue, setNumberValue] = useControlledState<number>(value, isNaN(defaultValue) ? NaN : defaultValue, smartOnChange);
  let tempNum = useRef<number>(NaN);
  let initialInputValue = isNaN(numberValue) ? '' : inputValueFormatter.format(numberValue);
  let [inputValue, setInputValue] = useState(initialInputValue);

  // this updates the field only if the formatter or number has changed, otherwise don't run it
  // if it's run when numberValue changes then going from $10 -> $1 will cause it to actually go to $1.00
  // because of this, we only fire onChange when scrolling/arrow keys/steppers/blur
  useEffect(() => {
    setInputValue(isNaN(numberValue) ? '' : inputValueFormatter.format(numberValue));
  }, [inputValueFormatter, setInputValue, numberValue]);

  let textValue = inputValueFormatter.format(numberValue);

  let increment = useCallback(() => {
    setNumberValue((previousValue) => {
      let prev = previousValue;
      if (isNaN(prev)) {
        // if the input is empty, start from the min value when incrementing
        prev = minValue;
        if (isMaxRange) {
          // unless the min/max range is at maximum, then start from 0
          prev = 0;
        } else if (minValue === Number.MIN_SAFE_INTEGER) {
          // or if the direction we want to start from is unbound, start from the bound
          prev = maxValue;
        }
      }

      if (!isNaN(tempNum.current)) {
        prev = tempNum.current;
        tempNum.current = NaN;
      }
      const newValue = clamp(
        handleDecimalOperation('+', prev, !isNaN(step) ? step : 1),
        minValue,
        maxValue,
        step
      );
      return newValue;
    });
  }, [setNumberValue, setInputValue, tempNum, handleDecimalOperation, minValue, maxValue, step, isMaxRange]);

  let incrementToMax = useCallback(() => {
    if (maxValue != null) {
      setNumberValue(clamp(maxValue, minValue, maxValue, step));
    }
  }, [maxValue, setNumberValue]);

  let decrement = useCallback(() => {
    setNumberValue((previousValue) => {
      let prev = previousValue;
      // if the input is empty, start from the max value when decrementing
      if (isNaN(prev)) {
        prev = maxValue;
        // unless the min/max range is at maximum, then start from 0
        if (isMaxRange) {
          prev = 0;
        } else if (maxValue === Number.MAX_SAFE_INTEGER) {
          // or if the direction we want to start from is unbound, start from the bound
          prev = minValue;
        }
      }
      if (!isNaN(tempNum.current)) {
        prev = tempNum.current;
        tempNum.current = NaN;
      }
      const newValue = clamp(
        handleDecimalOperation('-', prev, !isNaN(step) ? step : 1),
        minValue,
        maxValue,
        step
      );
      return newValue;
    });
  }, [setNumberValue, setInputValue, tempNum, handleDecimalOperation, minValue, maxValue, step]);

  let decrementToMin = useCallback(() => {
    if (minValue != null) {
      setNumberValue(clamp(minValue, minValue, maxValue, step));
    }
  }, [minValue, setNumberValue]);

  // if too slow, use string diffing, but i doubt these will be strings THAT large
  // should i check more than just the first character matches?
  let determineNumeralSystem = (value: string): string => {
    for (let system in numberingSystems) {
      let numerals = numberingSystems[system];
      if ([...value].some(char => numerals.some(numeral => numeral === char))) {
        setCurrentNumeralSystem(system);
        return system;
      }
    }
    // TODO: how should we handle this?
    // console.log('could not determine system, defaulting to latin');
    return 'latin';
  };

  // not sure best way to go about this given that numbers can have
  // max/min sigfigs and decimals, and some of the
  // formats have defaults, like currency
  // so take the approach of formatting our value
  // then joining together the relevant parts
  // then parsing that joined result back to a number
  // this should round us as the formatter does
  let roundValueUsingFormatter = (value: number): number => {
    let parts = inputValueFormatter.formatToParts(value);
    let strippedValue = parts.map((part) => {
      // list from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts
      switch (part.type) {
        case 'currency':
        case 'nan':
        case 'percentSign':
        case 'group':
        case 'infinity':
        case 'literal':
        case 'unit': // this is supported in chrome :-/ for {style: 'unit', unit: 'percent', signDisplay: 'always'}
          return '';
        case 'minusSign':
        case 'plusSign':
        case 'decimal':
        case 'fraction':
        case 'integer':
        default:
          return part.value;
      }
    }).join('');
    let result = numberParser.parse(strippedValue);
    if (formatOptions?.currencySign === 'accounting' && value < 0) {
      result = -1 * result;
    }
    // because the {style: 'percent'} adds two zeros to the end, we need to divide by 100 in that very specific case
    // otherwise we'll accidentally add 2 zeros when we format for real
    if (formatOptions?.style === 'percent') {
      result = result / 100;
    }
    return result;
  };

  let replaceAllButFirstOccurrence = (val: string, char: string) => {
    let first = val.indexOf(char);
    let prefix = val.substring(0, first + 1);
    let suffix = val.substring(first + 1).replace(char, '');
    return prefix + suffix;
  };

  let setValue = (value: string) => {
    let numeralSystem = determineNumeralSystem(value);

    let strippedValue = value.replace(new RegExp(`[^${minusSign}${plusSign}${numberingSystems[numeralSystem].join('')}${validCharacters}]`, 'g'), '');
    strippedValue = replaceAllButFirstOccurrence(strippedValue, minusSign);
    strippedValue = replaceAllButFirstOccurrence(strippedValue, plusSign);
    strippedValue = replaceAllButFirstOccurrence(strippedValue, decimal);

    // to parse the number, we need to remove anything that isn't actually part of the number, for example we want '-10.40' not '-10.40 USD'
    let parseReady = strippedValue.replace(new RegExp(`[${literals}]`, 'g'), '');
    let newValue = numberParser.parse(parseReady);
    // accounting will always be stripped to a positive number, so if it's accounting and has a () around everything, then we need to make it negative again
    if (formatOptions?.currencySign === 'accounting' && CURRENCY_SIGN_REGEX.test(strippedValue)) {
      newValue = -1 * newValue;
    }
    // when reading the number, if it's a percent, then it should be interpreted as being divided by 100
    if (formatOptions?.style === 'percent') {
      newValue = newValue / 100;
    }
    if (!isNaN(newValue) && (newValue > maxValue || newValue < minValue)) {
      return;
    }

    // If new value is a number less than max and more than min then update the number value
    if (!isNaN(newValue) && newValue <= maxValue && newValue >= minValue) {
      let roundedValue = roundValueUsingFormatter(newValue);
      tempNum.current = roundedValue;
    }

    setInputValue(strippedValue);
  };

  let commitInputValue = () => {
    // Set to empty state if input value is empty
    if (!inputValue.length) {
      tempNum.current = NaN;
      setNumberValue(NaN);
      setInputValue('');
      return;
    }
    let clampedValue;
    if (!isNaN(tempNum.current)) {
      clampedValue = clamp(tempNum.current, minValue, maxValue, step);
      tempNum.current = NaN;
    } else {
      clampedValue = clamp(numberValue, minValue, maxValue, step);
    }
    let newValue = isNaN(clampedValue) ? '' : inputValueFormatter.format(clampedValue);
    setNumberValue(clampedValue);
    setInputValue(newValue);
  };

  return {
    setValue,
    increment,
    incrementToMax,
    decrement,
    decrementToMin,
    value: numberValue,
    inputValue,
    commitInputValue,
    textValue: textValue === 'NaN' ? '' : textValue,
    currentNumeralSystem
  };
}

function handleDecimalOperation(operator, value1, value2) {
  let result = operator === '+' ? value1 + value2 : value1 - value2;

  // Check if we have decimals
  if (value1 % 1 !== 0 || value2 % 1 !== 0) {
    const value1Decimal = value1.toString().split('.');
    const value2Decimal = value2.toString().split('.');
    const value1DecimalLength = (value1Decimal[1] && value1Decimal[1].length) || 0;
    const value2DecimalLength = (value2Decimal[1] && value2Decimal[1].length) || 0;
    const multiplier = Math.pow(10, Math.max(value1DecimalLength, value2DecimalLength));

    // Transform the decimals to integers based on the precision
    value1 = Math.round(value1 * multiplier);
    value2 = Math.round(value2 * multiplier);

    // Perform the operation on integers values to make sure we don't get a fancy decimal value
    result = operator === '+' ? value1 + value2 : value1 - value2;

    // Transform the integer result back to decimal
    result /= multiplier;
  }

  return result;
}

// eslint-disable-next-line jsdoc/require-description-complete-sentence
/**
 * example -3500 in accounting
 * 0: {type: "literal", value: "("}
 * 1: {type: "currency", value: "€"}
 * 2: {type: "integer", value: "3"}
 * 3: {type: "group", value: ","}
 * 4: {type: "integer", value: "500"}
 * 5: {type: "decimal", value: "."}
 * 6: {type: "fraction", value: "00"}
 * 7: {type: "literal", value: ")"}
 *
 * example -3500 in normal
 * 0: {type: "minusSign", value: "-"}
 * 1: {type: "integer", value: "3"}
 * 2: {type: "group", value: "."}
 * 3: {type: "integer", value: "500"}
 * 4: {type: "decimal", value: ","}
 * 5: {type: "fraction", value: "00"}
 * 6: {type: "literal", value: " "}
 * 7: {type: "currency", value: "€"}
 *
 * example 3500 in always show sign
 * 0: {type: "plusSign", value: "+"}
 * 1: {type: "integer", value: "3"}
 * 2: {type: "group", value: "."}
 * 3: {type: "integer", value: "500"}
 * 4: {type: "decimal", value: ","}
 * 5: {type: "fraction", value: "00"}
 * 6: {type: "literal", value: " "}
 * 7: {type: "currency", value: "€"}
 */
