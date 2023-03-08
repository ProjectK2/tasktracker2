import { Component, createContext, createSignal, Index, onCleanup, useContext, For, createEffect } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { dateToReadableTimeString, msecToReadableString, msecToReadableStringJp, toKey } from './util';

const App: Component = () => {
  return (
    <>
      <div class="section">
        <h1 class="title">Task Tracker 2</h1>
        <Clock />
        <TaskTrackerProvider>
          <TaskTracker />
          <Exporter />
        </TaskTrackerProvider>
      </div>
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
  ["雑務", "発表会・講演会"],
  ["雑務", "情報収集"],
  ["雑務", "雑務"],
  ["その他", "勉強"],
  ["その他", "雑談"],
  ["休憩", "休憩"],
  ["時間外", "勤務中断"],
]

const categoryToColor = (category: string): string => {
  switch (category) {
    case "会議":
      return "#68A8D6";
    case "作業":
      return "#42f5c2";
    case "雑務":
      return "#B2B2B2";
    case "その他":
      return "#f5c542";
    case "休憩":
      return "#F17245"
    default:
      return "#000000";
  }
}

class State {
  currentTask: Task = {
    start: new Date(),
    finish: undefined,
    category: "休憩",
    title: "休憩",
  };
  finishedTasks: Task[] = [];
  reservingTasks: Task[] = [];
  date = new Date();

  save = () => {
    const key = toKey(new Date());
    localStorage.setItem(key, JSON.stringify(this));
    console.log("Saved", { key, raw: this, val: JSON.stringify(this) });
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
    json.currentTask.finish = json.currentTask.finish == null ? null : new Date(json.currentTask.finish);
    for (let i = 0; i < json.finishedTasks.length; i++) {
      json.finishedTasks[i].start = new Date(json.finishedTasks[i].start);
      json.finishedTasks[i].finish = new Date(json.finishedTasks[i].finish);
    }
    s.currentTask = json.currentTask;
    s.finishedTasks = json.finishedTasks;

    for (let i = 0; i < json.reservingTasks.length; i++) {
      json.reservingTasks[i].start = new Date(json.reservingTasks[i].start);
    }
    s.reservingTasks = json.reservingTasks;

    s.date = new Date(json.date);
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
      finish: undefined,
      category: category,
      title: title,
    };
    setState(produce((s) => {
      s.finishedTasks = [...s.finishedTasks, currentTask];
      s.currentTask = nextTask;
    }));
    state.save();
  };
  const startNextReservingTask = () => {
    if (state.reservingTasks.length == 0) {
      console.log("予約中のタスクがないのに予約中のタスクが開始されようとしている！");
      return;
    }
    const nextTask: Task = state.reservingTasks[0];
    const currentTask: Task = { ...state.currentTask, finish: nextTask.start };
    setState(produce((s) => {
      s.finishedTasks = [...s.finishedTasks, currentTask];
      s.currentTask = nextTask;
      s.reservingTasks.shift();
    }));
    state.save();
  };

  const clearAllTasks = () => {
    setState(produce((s) => {
      s.finishedTasks = [];
    }))
  };

  const reserveTask = (t: Task) => {
    setState(produce((s) => {
      s.reservingTasks.push(t);
      s.reservingTasks.sort((a, b) => a.start.getTime() - b.start.getTime());
      s.save();
    }))
  };

  const removeReservingTask = (i: number) => {
    setState(
      produce(
        (s) => {
          s.reservingTasks.splice(i, 1);
          s.save();
        }
      )
    )
  };

  const val = [state, {
    startNextTask,
    startNextReservingTask,
    clearAllTasks,
    reserveTask,
    removeReservingTask,
  }];
  return (
    <TaskTrackerContext.Provider value={val}>{props.children}</TaskTrackerContext.Provider>
  )
};

const TaskTracker = () => {
  return (
    <>
      <TimeChart></TimeChart>
      <div class="columns">
        <CurrentTask />
        <ReservingTasks />
      </div>
      <div class="columns">
        <NextTask />
        <FinishedTask />
      </div>
    </>
  )
}

const TimeChart = () => {
  const [state,] = useContext(TaskTrackerContext) as [State, any];

  const [t, setT] = createSignal(new Date());
  const timer = setInterval(() => setT(new Date()), 1000);
  onCleanup(() => clearInterval(timer));

  const width = 1200, height = 150, rectHeight = 135;
  const rxy = 16, rxy2 = 16;
  const tasks = (): Task[] => [state.currentTask, ...state.finishedTasks];
  const startHour = tasks().reduce((prev, cur: Task, i, arr) => Math.min(prev, cur.start.getHours()), 25);
  const oneHourWidth = width / (24 - startHour);

  const calcX = (h: number, m: number, s: number) => ((h - startHour) * 60 * 60 + m * 60 + s) * oneHourWidth / 60 / 60;
  const calcXFromDate = (d: Date) => calcX(d.getHours(), d.getMinutes(), d.getSeconds());
  const currentX = () => calcXFromDate(t());
  return (
    <>
      <figure class="image container">
        <svg width={width} height={height}>
          {/* タスクの表示 */}
          <For each={tasks()}>
            {(task, i) => {
              const x0 = () => calcXFromDate(task.start);
              const x1 = () => calcXFromDate((task.finish == null || task.finish === task.start) ? t() : task.finish);
              const col = () => categoryToColor(task.category);
              return (
                <>
                  <rect x={x0()} y="0" width={x1() - x0()} height={rectHeight} rx={rxy2} ry={rxy2} stroke="gray" fill={col()} />
                </>
              );
            }}
          </For>

          {/* 外枠＆補助 */}
          <rect x="2" y="2" width={width - 2} height={rectHeight - 2} rx={rxy} ry={rxy} stroke="black" stroke-width={4} fill="transparent" />
          <For each={[...Array(25).keys()].filter(x => startHour <= x)}>
            {(h, i) => {
              const x = (h - startHour) * oneHourWidth;
              return (
                <>
                  <line x1={x} y1={0} x2={x} y2={rectHeight} stroke="gray" stroke-width={1} stroke-dasharray="6" />
                  <text x={x} y={rectHeight + 15}>{h}</text>
                </>
              );
            }}
          </For>
          <line x1={currentX() + 3} y1={0} x2={currentX()} y2={rectHeight} stroke="black" stroke-width={3} />
        </svg>
      </figure>
    </>)
}

const CurrentTask = () => {
  const [state,] = useContext(TaskTrackerContext) as [State, any];
  const [t, setT] = createSignal(new Date());
  const timer = setInterval(() => setT(new Date()), 1000);
  onCleanup(() => clearInterval(timer));
  return (
    <div class="column block box">
      <h2 class="subtitle">現在のタスク</h2>
      <p>
        <span class="button">{state.currentTask.category}</span>
        <span class="button is-info is-light">{state.currentTask.title}</span>
        <span class="icon-text">
          <span class="icon is-medium"><i class="fas fa-lg fa-sharp fa-regular fa-clock"></i></span>
          <span>{dateToReadableTimeString(state.currentTask.start)}</span>
        </span>
        <span class="icon-text">
          <span class="icon is-medium"><i class="fas fa-lg fa-sharp fa-regular fa-stopwatch"></i></span>
          <span>{msecToReadableStringJp(t().getTime() - state.currentTask.start.getTime())}</span>
        </span>

      </p>
    </div>

  )
}

const ReservingTasks = () => {
  const [reservingCategoryAndTitle, setReservingCategoryAndTitle] = createSignal(CategoryAndTitle[0]);
  const [reservingTime, setReservingTime] = createSignal("");
  const [state, { startNextReservingTask, reserveTask, removeReservingTask }] = useContext(TaskTrackerContext) as [State, any];


  const [t, setT] = createSignal(new Date());
  const checkAndStartReservingTask = () => {
    const now = t();
    setT(new Date());
    if (state.reservingTasks.length == 0 || now < state.reservingTasks[0].start) {
      return;
    }
    startNextReservingTask();
  };
  const timer = setInterval(checkAndStartReservingTask, 10000);
  onCleanup(() => clearInterval(timer));

  const addReservingTask = () => {
    const [category, title] = reservingCategoryAndTitle();
    const reservingTimeNum = parseInt(reservingTime());
    const [hour, minute] = [Math.floor(reservingTimeNum / 100), reservingTimeNum % 100];

    const now = new Date();
    const start = new Date();
    if (isNaN(reservingTimeNum) || minute >= 60 || hour >= 24) {
      console.log("invalid time!");
      return;
    }
    start.setHours(hour);
    start.setMinutes(minute);
    start.setSeconds(0);
    start.setMilliseconds(0);
    if (now > start) {
      console.log("過去の予約をしようとしている！");
      return;
    }
    const task: Task = {
      start: start,
      finish: undefined,
      category: category,
      title: title,
    };
    reserveTask(task);
    setReservingTime("");
  };
  const deleteReservingTask = (i: number) => {
    removeReservingTask(i);
  };

  return (
    <div class="column block box">
      <h2 class="subtitle">予約</h2>
      <table class="table">
        <thead class="thead has-text-right">
          <tr>
            <th class="has-text-right">カテゴリ</th>
            <th class="has-text-right">タスク</th>
            <th class="has-text-right">開始</th>
            <th class="has-text-right">操作</th>
          </tr>
        </thead>
        <tbody class="tbody has-text-right">
          <For each={state.reservingTasks}>{
            (task: Task, i) => {
              let start = task.start;
              return (<>
                <tr>
                  <td>{task.category}</td>
                  <td>{task.title}</td>
                  <td>{dateToReadableTimeString(start)}</td>
                  <td><button class='button is-danger is-light is-small' onclick={() => deleteReservingTask(i())} >削除</button></td>
                </tr>
              </>);
            }
          }
          </For>
        </tbody>
      </table>
      <div class="field is-grouped">
        <select class="select" onchange={(e) => setReservingCategoryAndTitle(e.currentTarget.value.split("/") as [string, string])}>
          <Index each={CategoryAndTitle}>
            {(a, i) => {
              const [cat, tit] = a();
              return (<option value={`${cat}/${tit}`}>{cat}　＞　{tit}</option>);
            }
            }
          </Index>
        </select>
        <input type="number" id="reservingTime" placeholder='開始予定時刻' class="input is-primary" onchange={(e) => setReservingTime(e.currentTarget.value)} value={reservingTime()}></input>
        <button class="button" onclick={addReservingTask}>追加</button>
      </div>
    </div>
  )
}

const NextTask = () => {
  const [, { startNextTask }]: any = useContext(TaskTrackerContext) as [State, any];
  return (
    <div class="column block box">
      <h2 class="subtitle">次のタスク</h2>
      <ul>
        <Index each={CategoryAndTitle}>
          {(a, i) => {
            const [cat, tit] = a();
            return (<li>
              <span class="tag is-medium">{cat}</span>
              <button onclick={() => startNextTask(cat, tit)} class="button">
                {tit}
              </button>
            </li>);
          }
          }
        </Index>
      </ul>
    </div>
  );
}

const FinishedTask = () => {
  const [state, { clearAllTasks }] = useContext(TaskTrackerContext) as [State, any];
  return (
    <div class="column block box">
      <h2 class="subtitle">終わったタスク</h2>
      <table class="table">
        <thead class="thead has-text-right">
          <tr>
            <th class="has-text-right">カテゴリ</th>
            <th class="has-text-right">タスク</th>
            <th class="has-text-right">開始</th>
            <th class="has-text-right">終了</th>
            <th class="has-text-right">時間</th>
          </tr>
        </thead>
        <tbody class="tbody has-text-right">
          <For each={state.finishedTasks}>{
            (task: Task, i) => {
              let finish = task.finish;
              let start = task.start;
              let diff = finish.getTime() - start.getTime();
              let diffs = msecToReadableStringJp(diff);
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
      <button onclick={() => clearAllTasks()} class="button is-danger">タスクのクリア</button>
    </div>
  );
}

const Exporter = () => {
  const [state,] = useContext(TaskTrackerContext) as [State, any];
  const exportData = (event) => {
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  };
  const exportDataAll = (event) => {
    let json = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = JSON.parse(localStorage.getItem(k));
      json[k] = v;
    }
    json[toKey(state.date)] = state;
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  };
  return (
    <div class="block box">
      <button class="button" onclick={exportData}>Export Data</button>
      <button class="button" onclick={exportDataAll}>Export All</button>
    </div>
  )
}

export default App;
