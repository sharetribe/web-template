import React, { Component } from 'react';
import { H3, IconCheckmark } from '../../components';
import Button, { PrimaryButton, SecondaryButton, InlineTextButton } from './Button';

import css from './ButtonExample.module.css';

const preventDefault = e => {
  e.preventDefault();
};

const hashLink = '#';
class InteractiveButton extends Component {
  constructor(props) {
    super(props);
    this.inProgressTimeoutId = null;
    this.readyTimeoutId = null;
    this.state = { inProgress: false, disabled: false, ready: false };
  }
  componentWillUnmount() {
    window.clearTimeout(this.inProgressTimeoutId);
    window.clearTimeout(this.readyTimeoutId);
  }
  render() {
    const handleClick = () => {
      window.clearTimeout(this.inProgressTimeoutId);
      window.clearTimeout(this.readyTimeoutId);
      this.setState({ inProgress: true, disabled: true });
      this.inProgressTimeoutId = window.setTimeout(() => {
        this.setState({ inProgress: false, disabled: false, ready: true });
        this.readyTimeoutId = window.setTimeout(() => {
          this.setState({ inProgress: false, disabled: false, ready: false });
        }, 2000);
      }, 2000);
    };

    return (
      <Button {...this.state} onClick={handleClick}>
        Click me
      </Button>
    );
  }
}

const ButtonsComponent = () => {
  return (
    <div>
      <H3>Interactive button:</H3>
      <InteractiveButton />

      <H3>Button with a translation:</H3>
      <Button>
        <span>Clique moi</span>
      </Button>

      <H3>Button with an icon and a text:</H3>
      <Button>
        <IconCheckmark rootClassName={css.customIcon} />
        <span>Custom text</span>
      </Button>

      <H3>Default button:</H3>
      <Button>Click me</Button>

      <H3>Default button disabled:</H3>
      <Button disabled>Click me</Button>

      <H3>Default button in progress:</H3>
      <Button inProgress>Click me</Button>

      <H3>Default button ready:</H3>
      <Button ready>Click me</Button>

      <H3>Default button disabled and in progress:</H3>
      <Button disabled inProgress>
        Click me
      </Button>

      <H3>Default button disabled and ready:</H3>
      <Button disabled ready>
        Click me
      </Button>

      <H3>Primary button:</H3>
      <PrimaryButton>Click me</PrimaryButton>

      <H3>Primary button disabled:</H3>
      <PrimaryButton disabled>Click me</PrimaryButton>

      <H3>Primary button in progress:</H3>
      <PrimaryButton inProgress>Click me</PrimaryButton>

      <H3>Primary button ready:</H3>
      <PrimaryButton ready>Click me</PrimaryButton>

      <H3>Primary button disabled and in progress:</H3>
      <PrimaryButton disabled inProgress>
        Click me
      </PrimaryButton>

      <H3>Primary button disabled and ready:</H3>
      <PrimaryButton disabled ready>
        Click me
      </PrimaryButton>

      <H3>Secondary button:</H3>
      <SecondaryButton>Click me</SecondaryButton>

      <H3>Secondary button disabled:</H3>
      <SecondaryButton disabled>Click me</SecondaryButton>

      <H3>Secondary button in progress:</H3>
      <SecondaryButton inProgress>Click me</SecondaryButton>

      <H3>Secondary button ready:</H3>
      <SecondaryButton ready>Click me</SecondaryButton>

      <H3>Secondary button disabled and in progress:</H3>
      <SecondaryButton disabled inProgress>
        Click me
      </SecondaryButton>

      <H3>Secondary button disabled and ready:</H3>
      <SecondaryButton disabled ready>
        Click me
      </SecondaryButton>

      <H3>Inline text button:</H3>
      <p>
        Lorem ipsum <InlineTextButton>button that looks like link</InlineTextButton> dolor sit amet
      </p>
      <p>
        Lorem ipsum{' '}
        <a href={hashLink} onClick={preventDefault}>
          a normal link
        </a>{' '}
        dolor sit amet
      </p>

      <H3>Link that looks like a default button:</H3>
      <a className={css.buttonLink} href={hashLink} onClick={preventDefault}>
        Click me
      </a>

      <H3>Translated link that looks like a default button:</H3>
      <a className={css.buttonLink} href={hashLink} onClick={preventDefault}>
        <span>Clique moi</span>
      </a>

      <H3>Link that looks like a primary button:</H3>
      <a className={css.buttonLinkPrimary} href={hashLink} onClick={preventDefault}>
        Click me
      </a>

      <H3>Link that looks like a secondary button:</H3>
      <a className={css.buttonLinkSecondary} href={hashLink} onClick={preventDefault}>
        Click me
      </a>

      <H3>Button with custom styles:</H3>
      <Button rootClassName={css.customButton}>Click me</Button>
    </div>
  );
};

export const Buttons = {
  component: ButtonsComponent,
  group: 'buttons',
};
