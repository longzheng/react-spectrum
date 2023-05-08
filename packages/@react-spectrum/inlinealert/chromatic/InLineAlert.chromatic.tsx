/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {InlineAlert} from '../';
import {Meta, Story} from '@storybook/react';
import React from 'react';

interface SpectrumInlineAlertProps {

}

// see https://github.com/storybookjs/storybook/issues/8426#issuecomment-669021940
const StoryFn = ({storyFn}) => storyFn();

const meta: Meta<SpectrumInlineAlertProps> = {
  title: 'InlineAlert',
  component: InlineAlert,
  decorators: [storyFn => <StoryFn storyFn={storyFn} />]
};

export default meta;

const Template = (): Story<SpectrumInlineAlertProps> => (args) => (
  <InlineAlert {...args}>This is a React Spectrum InlineAlert</InlineAlert>
);

export const Default = Template().bind({});
Default.args = {};
