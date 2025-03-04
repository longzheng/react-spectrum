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

import CheckmarkMedium from '@spectrum-icons/ui/CheckmarkMedium';
import {classNames, ClearSlots, SlotProvider} from '@react-spectrum/utils';
import {filterDOMProps, mergeProps} from '@react-aria/utils';
import {FocusRing} from '@react-aria/focus';
import {Grid} from '@react-spectrum/layout';
import {isFocusVisible, useHover} from '@react-aria/interactions';
import {ListBoxContext} from './ListBoxContext';
import {Node} from '@react-types/shared';
import React, {useContext, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {Text} from '@react-spectrum/text';
import {useOption} from '@react-aria/listbox';

interface OptionProps<T> {
  item: Node<T>,
  shouldSelectOnPressUp?: boolean,
  shouldFocusOnHover?: boolean,
  shouldUseVirtualFocus?: boolean
}

/** @private */
export function ListBoxOption<T>(props: OptionProps<T>) {
  let {
    item,
    shouldSelectOnPressUp,
    shouldFocusOnHover,
    shouldUseVirtualFocus
  } = props;

  let {
    rendered,
    key
  } = item;
  let domProps = filterDOMProps(item.props);
  delete domProps.id;
  let state = useContext(ListBoxContext);

  let ref = useRef<HTMLDivElement>();
  let {optionProps, labelProps, descriptionProps, isSelected, isDisabled, isFocused} = useOption(
    {
      'aria-label': item['aria-label'],
      key,
      shouldSelectOnPressUp,
      shouldFocusOnHover,
      isVirtualized: true,
      shouldUseVirtualFocus
    },
    state,
    ref
  );
  let {hoverProps, isHovered} = useHover({
    ...props,
    isDisabled
  });

  let contents = typeof rendered === 'string'
    ? <Text>{rendered}</Text>
    : rendered;

  let isKeyboardModality = isFocusVisible();

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <div
        {...mergeProps(optionProps, shouldFocusOnHover ? {} : hoverProps, domProps)}
        ref={ref}
        className={classNames(
          styles,
          'spectrum-Menu-item',
          {
            // If using virtual focus, apply focused styles to the item when the user is interacting with keyboard modality
            'is-focused': shouldUseVirtualFocus && isFocused && isKeyboardModality,
            'is-disabled': isDisabled,
            'is-selected': isSelected,
            'is-selectable': state.selectionManager.selectionMode !== 'none',
            // When shouldFocusOnHover is false, apply hover styles both when hovered with the mouse.
            // Otherwise, apply hover styles when focused using non-keyboard modality.
            'is-hovered': (isHovered && !shouldFocusOnHover) || (isFocused && !isKeyboardModality)
          }
        )}>
        <Grid
          UNSAFE_className={
            classNames(
              styles,
              'spectrum-Menu-itemGrid'
            )
          }>
          <ClearSlots>
            <SlotProvider
              slots={{
                text: {UNSAFE_className: styles['spectrum-Menu-itemLabel'], ...labelProps},
                icon: {size: 'S', UNSAFE_className: styles['spectrum-Menu-icon']},
                description: {UNSAFE_className: styles['spectrum-Menu-description'], ...descriptionProps}
              }}>
              {contents}
              {isSelected &&
                <CheckmarkMedium
                  slot="checkmark"
                  UNSAFE_className={
                    classNames(
                      styles,
                      'spectrum-Menu-checkmark'
                    )
                  } />
              }
            </SlotProvider>
          </ClearSlots>
        </Grid>
      </div>
    </FocusRing>
  );
}
