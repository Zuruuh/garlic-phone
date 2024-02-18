import { FieldApi } from '@tanstack/solid-form';
import type { Component } from 'solid-js';

interface FieldInfoProps {
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
