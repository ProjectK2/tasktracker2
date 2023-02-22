import { Component, createSignal, Index, onCleanup } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import Comp from './Comp';

const App: Component = () => {
  return (
    <>
      <h1>Task Tracker 2</h1>
      <Clock />
      <TaskTracker />
    </>
  );
};

const Clock = () => {
  const [t, setT] = createSignal((new Date()).toTimeString());
  const timer = setInterval(() => setT((new Date()).toTimeString()), 1000);
  onCleanup(() => clearInterval(timer));
  return (
    <div>{t()}</div>
  );
}

type Task = {
  start: Date,
  finish: Date,
  category: string,
  title: string,
}

const CategoryAndTitle: [string, string][] = [
  ["会議", "定例"],
  ["会議", "臨時"],
  ["作業", "特許"],
  ["作業", "プログラミング"],
  ["作業", "計測・データ処理"],
  ["作業", "資料作成"],
  ["雑務", "情報収集"],
  ["雑務", "雑務"],
  ["その他", "勉強"],
  ["その他", "雑談"],
  ["休憩", "休憩"],
]

type State = {
  currentTask: Task,
  finishedTasks: Task[],
}

const TaskTracker = () => {
  const now = new Date();
  const initialState: State = {
    currentTask: {
      start: now,
      finish: now,
      category: "休憩",
      title: "休憩"
    },
    finishedTasks: [],
  }
  const [state, setState] = createStore(initialState);

  const startNextTask = (category: string, title: string) => {
    const now = new Date();
    const currentTask: Task = { ...state.currentTask, finish: now };
    const nextTask: Task = {
      start: now,
      finish: now,
      category: category,
      title: title,
    };
    setState(produce((s) => {
      s.finishedTasks = [...s.finishedTasks, currentTask];
      s.currentTask = nextTask;
    }));
    console.log(state);
  };
  return (
    <>
      <div>task tracking</div>

      <div>
        <h2>現在のタスク</h2>
        <div>
          <span>{state.currentTask.category}</span>＞
          <span>{state.currentTask.title}</span>：
          <span>{state.currentTask.start.toTimeString()}</span>
        </div>
      </div>
      <div>
        <h2>次のタスク</h2>
        <Index each={CategoryAndTitle}>
          {(a, i) => {
            const [cat, tit] = a();
            return (<li>
              <button onclick={() => startNextTask(cat, tit)}>{cat}＞{tit}</button>
            </li>);
          }
          }
        </Index>
      </div>
      <div>
        <h2>終わったタスク</h2>
        <Index each={state.finishedTasks}>{(task, i) =>
          <li>{i}: {task().category}＞{task().title}</li>
        }
        </Index>
      </div>
    </>
  )
}

export default App;
