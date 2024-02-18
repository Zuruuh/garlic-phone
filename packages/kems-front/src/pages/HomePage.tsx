import { Navigate } from '@solidjs/router';
import { createEffect, type Component, Switch, Match } from 'solid-js';
import {
  createMutation,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';
import { createForm } from '@tanstack/solid-form';
import { valibotValidator } from '@tanstack/valibot-form-adapter';
import { string, minLength } from 'valibot';
import { api } from '../api';
import { FieldInfo } from '../components/form';
import { css } from '../../styled-system/css';

const HomePage: Component = () => {
  const playerId = createQuery<{ name: string; id: string }>(() => ({
    queryKey: ['player'],
    queryFn: async () => {
      return Promise.reject(new Error());
    },
    retryDelay: 0,
  }));

  createEffect(() => console.log(playerId.status));
  createEffect(() => console.log(playerId.data?.name));

  return (
    <main class={css({ backgroundColor: 'black' })}>
      <h1>Kems</h1>
      <Switch fallback={<RegisterForm />}>
        <Match when={playerId.isPending}>
          {/* loader */}
          Loading...
        </Match>
        <Match when={playerId.isSuccess}>
          <Navigate href="/join-room" />
        </Match>
      </Switch>
    </main>
  );
};

export default HomePage;

const RegisterForm: Component = () => {
  const queryClient = useQueryClient();
  const form = createForm(() => ({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => playerIdMutation.mutateAsync(value.name),
    validatorAdapter: valibotValidator,
  }));

  const playerIdMutation = createMutation(() => ({
    mutationKey: ['player'],
    mutationFn: async (name: string) => {
      const res = await api.register.$post({ json: { name } });
      if (!res.ok) {
        throw new Error(await res.json());
      }

      return {
        name,
        id: await res.text(),
      };
    },
    onSuccess: async (value) => {
      queryClient.setQueryData(['player'], value);
    },
  }));

  return (
    <form.Provider>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          validators={{
            onChange: string([
              minLength(2, 'Your username must be at least 2 chars long'),
            ]),
          }}
          children={(field) => (
            <div>
              <label for={field().name}>Username:</label>
              <input
                id={field().name}
                name={field().name}
                value={field().state.value}
                onBlur={field().handleBlur}
                onInput={(e) => field().handleChange(e.target.value)}
              />
              <FieldInfo field={field()} />
            </div>
          )}
        />
      </form>
    </form.Provider>
  );
};
