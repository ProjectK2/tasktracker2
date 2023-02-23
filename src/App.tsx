import { Component, createContext, createSignal, Index, onCleanup, useContext, For } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { dateToReadableTimeString, msecToReadableString, msecToReadableStringJp } from './util';

const App: Component = () => {
  return (
    <>
      <h1>Task Tracker 2</h1>
      <Clock />
      <TaskTrackerProvider>
        <TaskTracker />
      </TaskTrackerProvider>

    </>
  );
};

const Clock = () => {
  const [t, setT] = createSignal(new Date());
  const timer = setInterval(() => setT(new Date()), 1000);
  onCleanup(() => clearInterval(timer));
  return (
    <h2>{t().getFullYear()}/{t().getMonth()}/{t().getDate()} {dateToReadableTimeString(t())}</h2>
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

const TaskTrackerContext = createContext();

const TaskTrackerProvider = (props) => {
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

  const clearAllTasks = () => {
    setState(produce((s) => {
      s.finishedTasks = [];
    }))
  }

  const val = [state, {
    startNextTask: startNextTask,
    clearAllTasks: clearAllTasks,
  }];
  return (
    <TaskTrackerContext.Provider value={val}>{props.children}</TaskTrackerContext.Provider>
  )
};

const TaskTracker = () => {
  return (
    <>
      <CurrentTask />
      <NextTask />
      <FinishedTask />
    </>
  )
}

const CurrentTask = () => {
  const [state,]: any = useContext(TaskTrackerContext);
  const [t, setT] = createSignal(new Date());
  const timer = setInterval(() => setT(new Date()), 1000);
  onCleanup(() => clearInterval(timer));
  return (
    <div>
      <h2>現在のタスク</h2>
      <div>
        <span>{state.currentTask.category}</span>＞
        <span>{state.currentTask.title}</span>：
        <span>{dateToReadableTimeString(state.currentTask.start)}</span>：
        <span>{msecToReadableStringJp(t().getTime() - state.currentTask.start.getTime())}</span>
      </div>
    </div>

  )
}

const NextTask = () => {
  const [, { startNextTask }]: any = useContext(TaskTrackerContext);
  return (
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
  );
}

const FinishedTask = () => {
  const [state, { clearAllTasks }]: any = useContext(TaskTrackerContext);
  return (
    <div>
      <h2>終わったタスク</h2>
      <table>
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>タスク</th>
            <th>開始</th>
            <th>終了</th>
            <th>時間</th>
          </tr>
        </thead>
        <tbody>
          <For each={state.finishedTasks}>{
            (task: Task, i) => {
              let finish = task.finish;
              let start = task.start;
              let diff = finish.getTime() - start.getTime();
              let diffs = msecToReadableString(diff);
              return (<>
                <tr>
                  <td>{task.category}</td>
                  <td>{task.title}</td>
                  <td>{dateToReadableTimeString(start)}</td>
                  <td>{dateToReadableTimeString(finish)}</td>
                  <td>{diffs}</td>
                </tr>
              </>);
            }
          }
          </For>

        </tbody>
      </table>
      <button onclick={() => clearAllTasks()}>タスクのクリア</button>
    </div>
  );
}

export default App;
