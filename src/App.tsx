import { Component, createContext, createSignal, Index, onCleanup, useContext, For } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { dateToReadableTimeString, msecToReadableString, msecToReadableStringJp, toKey } from './util';

const App: Component = () => {
  return (
    <>
      <h1 class="title">Task Tracker 2</h1>
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
    <h2 class="subtitle">{t().getFullYear()}/{t().getMonth()}/{t().getDate()} {dateToReadableTimeString(t())}</h2>
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

class State {
  currentTask: Task = {
    start: new Date(),
    finish: undefined,
    category: "休憩",
    title: "休憩",
  };
  finishedTasks: Task[] = [];
  date = new Date();

  save = () => {
    const key = toKey(new Date());
    localStorage.setItem(key, JSON.stringify(this));
    console.log("Saved", { key, val: JSON.stringify(this) });
  };

}

const loadState = (date: Date): State => {
  const key = toKey(date);
  const val = localStorage.getItem(key);
  let s = new State();
  if (val === null) {
    return s;
  }
  try {
    let json = JSON.parse(val);
    json.currentTask.start = new Date(json.currentTask.start);
    for (let i = 0; i < json.finishedTasks.length; i++) {
      json.finishedTasks[i].start = new Date(json.finishedTasks[i].start);
      json.finishedTasks[i].finish = new Date(json.finishedTasks[i].finish);
    }
    s.currentTask = json.currentTask;
    s.finishedTasks = json.finishedTasks;
    console.log("Loaded", { key, val: s });
    return s;
  } catch {
    console.log("loaded, but failed to parse: ", val);
    return s;
  }
}

const TaskTrackerContext = createContext();

const TaskTrackerProvider = (props) => {
  const initialState: State = loadState(new Date());
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
    state.save();
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
      <hr></hr>
      <div class="columns">
        <NextTask />
        <FinishedTask />
      </div>
    </>
  )
}

const CurrentTask = () => {
  const [state,]: any = useContext(TaskTrackerContext);
  const [t, setT] = createSignal(new Date());
  const timer = setInterval(() => setT(new Date()), 1000);
  onCleanup(() => clearInterval(timer));
  return (
    <div class="block">
      <h2 class="subtitle">現在のタスク</h2>
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
    <div class="column block">
      <h2 class="subtitle">次のタスク</h2>
      <Index each={CategoryAndTitle}>
        {(a, i) => {
          const [cat, tit] = a();
          return (<li>
            <button onclick={() => startNextTask(cat, tit)} class="button">
              {cat}＞{tit}
            </button>
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
    <div class="column block">
      <h2 class="subtitle">終わったタスク</h2>
      <table class="table">
        <thead class="thead">
          <tr>
            <th>カテゴリ</th>
            <th>タスク</th>
            <th>開始</th>
            <th>終了</th>
            <th>時間</th>
          </tr>
        </thead>
        <tbody class="tbody">
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
