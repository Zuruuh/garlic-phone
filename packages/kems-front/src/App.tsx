import './App.css';
import type { Api } from '@kems/back';
import { hc } from 'hono/client';
import { Show, createEffect, createSignal } from 'solid-js';

const api = hc<Api>('http://localhost:8000');

const App = () => {
  const [text, setText] = createSignal<null | string>(null);

  createEffect(async () => {
    const res = await api.register.$post({ json: { name: 'test' } });
    setText(await res.text());
  });

  return (
    <div class="content">
      <h1>Rsbuild with Solid</h1>
      <p>Start building amazing things with Rsbuild.</p>
      <Show when={text() !== null}>
        <p>{text()}</p>
      </Show>
    </div>
  );
};

export default App;
