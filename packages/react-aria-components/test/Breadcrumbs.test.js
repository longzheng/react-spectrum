/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Breadcrumbs, Item, Link} from 'react-aria-components';
import React from 'react';
import {render} from '@react-spectrum/test-utils';

let renderBreadcrumbs = (breadcrumbsProps, itemProps) => render(
  <Breadcrumbs {...breadcrumbsProps}>
    <Item {...itemProps}><Link><a href="/">Home</a></Link></Item>
    <Item {...itemProps}><Link><a href="/react-aria">React Aria</a></Link></Item>
    <Item {...itemProps}><Link>useBreadcrumbs</Link></Item>
  </Breadcrumbs>
);

describe('Breadcrumbs', () => {
  it('should render with default class', () => {
    let {getByRole, getAllByRole} = renderBreadcrumbs();
    let breadcrumbs = getByRole('navigation');
    expect(breadcrumbs).toHaveClass('react-aria-Breadcrumbs');

    for (let item of getAllByRole('listitem')) {
      expect(item).toHaveClass('react-aria-Item');
    }

    let links = getAllByRole('link');
    expect(links[0]).toHaveAttribute('class', 'react-aria-Link');
    expect(links[0]).not.toHaveAttribute('aria-current');
    expect(links[2]).toHaveAttribute('aria-current', 'page');
  });

  it('should render with custom class', () => {
    let {getByRole, getAllByRole} = renderBreadcrumbs({className: 'breadcrumbs'}, {className: 'item'});
    let breadcrumbs = getByRole('navigation');
    expect(breadcrumbs).toHaveClass('breadcrumbs');

    for (let item of getAllByRole('listitem')) {
      expect(item).toHaveClass('item');
    }
  });
});