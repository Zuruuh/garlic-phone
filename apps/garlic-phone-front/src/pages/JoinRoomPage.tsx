import { Navigate } from '@solidjs/router';
import { createForm } from '@tanstack/solid-form';
import { createQuery } from '@tanstack/solid-query';
import { valibotValidator } from '@tanstack/valibot-form-adapter';
import { Switch, type Component, Match } from 'solid-js';
import { length, minLength, string } from 'valibot';
import { FieldInfo } from '../components/form';

const JoinRoomPage: Component = () => {
  const playerId = createQuery<{ name: string; id: string }>(() => ({
    queryKey: ['player'],
    queryFn: async () => {
      return Promise.reject(new Error());
    },
    retryDelay: 0,
  }));

  const joinRoomForm = createForm(() => ({
    validatorAdapter: valibotValidator,
    defaultValues: {
      roomId: '',
    },
  }));

  const createRoomForm = createForm(() => ({
    validatorAdapter: valibotValidator,
    defaultValues: {
      roomName: '',
    },
  }));

  return (
    <Switch fallback={<Navigate href="/" />}>
      <Match when={playerId.isPending}>
        <p>loading...</p>
      </Match>
      <Match when={playerId.isSuccess}>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void joinRoomForm.handleSubmit();
            }}
          >
            <joinRoomForm.Field
              name="roomId"
              validators={{
                onChange: string([length(21, 'Invalid room id')]),
              }}
            >
              {(field) => (
                <div>
                  <label for={field().name}>Room ID:</label>
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
            </joinRoomForm.Field>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void createRoomForm.handleSubmit();
            }}
          >
            <createRoomForm.Field
              name="roomName"
              validators={{
                onChange: string([
                  minLength(
                    2,
                    "Your room's name must be at least 2 characters long.",
                  ),
                ]),
              }}
            >
              {(field) => (
                <div>
                  <label for={field().name}>Room name:</label>
                  <input
                    id={field().name}
                    name={field().name}
                    value={field().state.value}
                    onBlur={field().handleBlur}
                    onInput={(e) => field().handleChange(e.target.value)}
                  />
                </div>
              )}
            </createRoomForm.Field>
          </form>
        </div>
      </Match>
    </Switch>
  );
};

export default JoinRoomPage;
