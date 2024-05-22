import type { FieldApi } from '@tanstack/solid-form';
import type { Component } from 'solid-js';

interface FieldInfoProps {
  // biome-ignore lint/suspicious/noExplicitAny: typing is annoying to get right
  field: FieldApi<any, any, any, any>;
}

export const FieldInfo: Component<FieldInfoProps> = (props) => {
  return (
    <>
      {props.field.state.meta.touchedErrors ? (
        <em>{props.field.state.meta.touchedErrors}</em>
      ) : null}
      {props.field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
};
