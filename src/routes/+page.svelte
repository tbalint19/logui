<script lang="ts">
	import { onMount } from "svelte";
  import LogPresenter from "$lib/components/LogPresenter.svelte";

  type JSONStringifiable =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JSONStringifiable }
    | JSONStringifiable[];

  type LogLevel = typeof logLevels[number]

  type Log = { level: LogLevel, tags: string[], time: number, msg: string } & Record<string, JSONStringifiable>

  const logLevels = [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
  ] as const

  let selectedLogLevel = $state<LogLevel>("trace")
  let levelFilterMode = $state<"strict" | "upwards" | "downwards">("upwards")
  let tagFilter = $state("")
  let logs = $state<Log[]>([])
  let tail = $state(true)

  const matches = (regex: string, tags: string[] | undefined) => {
      let actualRegex: RegExp | null = null
      const isNegation = regex.startsWith("!")
      const regexDesc = isNegation ? regex.substring(1) : regex
      try {
        actualRegex = new RegExp(regexDesc)
      } catch (error) { }
      if (!actualRegex)
        return true
      if (!tags)
        return isNegation
      if (isNegation)
        return tags.every(tag => !tag.match(actualRegex))
      return tags.some(tag => tag.match(actualRegex))
    }

  let presentedLogs = $derived([ ...logs ].reverse().filter(log => {

    if (levelFilterMode === "strict") {
      if (logLevels.indexOf(log.level) !== logLevels.indexOf(selectedLogLevel))
        return false
    }
    if (levelFilterMode === "upwards") {
      if (logLevels.indexOf(log.level) < logLevels.indexOf(selectedLogLevel))
        return false
    }
    if (levelFilterMode === "downwards") {
      if (logLevels.indexOf(log.level) > logLevels.indexOf(selectedLogLevel))
        return false
    }

    if (tagFilter && !tagFilter
      .split(",")
      .map(regex => regex.trim())
      .every(regex => matches(regex, log.tags)))
      return false

    return true
  }))

  const fetchLogs = async (last?: number) => {
    const url = last ? `/api/load?from=${last}` : `/api/load`
    const response = await fetch(url).catch(() => {})
    if (!response)
      return
    const data = await response.json()
    const parseLevel = (log: any) => {
      if (typeof log.level === "string")
        return log
      log.level = log.level === 10 ? "trace" : log.level === 20 ? "debug" : log.level === 30 ? "info" : log.level === 40 ? "warn" : log.level === 50 ? "error" : "fatal"
      return log
    }
    logs = [ ...logs, ...data.map(parseLevel) ]
  }
  
  const deleteLogs = async () => {
    const response = await fetch(`/api/delete`).catch(() => {})
    if (!response)
      return
    const data = await response.json()
    logs = [ ]
  }
  
  const getColor = (logLevel: LogLevel) => {
    switch (logLevel) {
      case "trace":
        return "bg-primary-content text-neutral-content"
      case "debug":
        return "bg-primary-content text-success"
      case "info":
        return "bg-primary-content text-info"
      case "warn":
        return "bg-primary-content text-warning"
      case "error":
        return "bg-primary-content text-error"
      case "fatal":
        return "bg-error text-error-content"
    }
  }

  const getBorder = (logLevel: LogLevel) => {
    if (levelFilterMode === "strict") {
      if (logLevels.indexOf(logLevel) !== logLevels.indexOf(selectedLogLevel))
        return 'border-2'
    }
    if (levelFilterMode === "upwards") {
      if (logLevels.indexOf(logLevel) < logLevels.indexOf(selectedLogLevel))
        return 'border-2'
    }
    if (levelFilterMode === "downwards") {
      if (logLevels.indexOf(logLevel) > logLevels.indexOf(selectedLogLevel))
        return 'border-2'
    }
    return 'border-2 border-neutral-content'
  }

  const selectLevel = (level: LogLevel) => {
    if (selectedLogLevel !== level) {
      levelFilterMode = "upwards"
    }
    else {
      if (levelFilterMode === "upwards")
        levelFilterMode = "strict"
      else if (levelFilterMode === "strict")
        levelFilterMode = "downwards"
      else
        levelFilterMode = "upwards"
    }
    selectedLogLevel = level
  }

  onMount(() => {
    fetchLogs()

    const interval = setInterval(() => {
      if (tail)
        fetchLogs(logs[logs.length-1]?.time)
    }, 1000)

    /* let pressedButtons: string[] = []

    const handle = (event: Event, buttons: string[], action: () => void) => {
      if (buttons.every(button => pressedButtons.includes(button))) {
        event.preventDefault()
        action()
      }
    }

    const keydownHandler = (event: KeyboardEvent) => {
      if (!pressedButtons.includes(event.code))
        pressedButtons = [ ...pressedButtons, event.code ]
      handle(event, [ "AltRight", "Digit1" ], () => { selectLevel("trace") })
      handle(event, [ "AltLeft", "Digit1" ], () => { selectLevel("trace") })
      handle(event, [ "AltRight", "Digit2" ], () => { selectLevel("debug") })
      handle(event, [ "AltLeft", "Digit2" ], () => { selectLevel("debug") })
      handle(event, [ "AltRight", "Digit3" ], () => { selectLevel("info") })
      handle(event, [ "AltLeft", "Digit3" ], () => { selectLevel("info") })
      handle(event, [ "AltRight", "Digit4" ], () => { selectLevel("warn") })
      handle(event, [ "AltLeft", "Digit4" ], () => { selectLevel("warn") })
      handle(event, [ "AltRight", "Digit5" ], () => { selectLevel("error") })
      handle(event, [ "AltLeft", "Digit5" ], () => { selectLevel("error") })
      handle(event, [ "AltRight", "Digit6" ], () => { selectLevel("fatal") })
      handle(event, [ "AltLeft", "Digit6" ], () => { selectLevel("fatal") })
      handle(event, [ "AltRight", "KeyR" ], () => { deleteLogs() })
      handle(event, [ "AltLeft", "KeyR" ], () => { deleteLogs() })
      handle(event, [ "AltRight", "KeyS" ], () => { tail = !tail })
      handle(event, [ "AltLeft", "KeyS" ], () => { tail = !tail })
      handle(event, [ "AltRight", "KeyF" ], () => { document.getElementById('filter')?.focus() })
      handle(event, [ "AltLeft", "KeyF" ], () => { document.getElementById('filter')?.focus() })
      handle(event, [ "AltRight", "ArrowRight" ], () => { levelFilterMode = "upwards" })
      handle(event, [ "AltLeft", "ArrowRight" ], () => { levelFilterMode = "upwards" })
      handle(event, [ "AltRight", "ArrowLeft" ], () => { levelFilterMode = "downwards" })
      handle(event, [ "AltLeft", "ArrowLeft" ], () => { levelFilterMode = "downwards" })
      handle(event, [ "AltRight", "ArrowUp" ], () => { levelFilterMode = "strict" })
      handle(event, [ "AltLeft", "ArrowUp" ], () => { levelFilterMode = "strict" })
      handle(event, [ "AltRight", "ArrowDown" ], () => { levelFilterMode = "strict" })
      handle(event, [ "AltLeft", "ArrowDown" ], () => { levelFilterMode = "strict" })
    }
    
    const keyupHandler = (event: KeyboardEvent) => {
      pressedButtons = pressedButtons.filter(k => k !== event.code)
    } */

    /* document.body.addEventListener('keydown', keydownHandler)
    document.body.addEventListener('keyup', keyupHandler) */

    return () => {
      clearInterval(interval)
      /* document.body.removeEventListener('keydown', keydownHandler)
      document.body.removeEventListener('keyup', keyupHandler) */
    }
  })
</script>

<main>
  <div class="flex items-center p-3 bg-accent-content justify-between">
    <div class="flex gap-2">
      <!-- <button class="btn btn-error" aria-label="clear" onclick={deleteLogs}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="currentColor"><path fill-rule="evenodd" d="M17 5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1H4a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V7h1a1 1 0 1 0 0-2zm-2-1H9v1h6zm2 3H7v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1z" clip-rule="evenodd"/><path d="M9 9h2v8H9zm4 0h2v8h-2z"/></g></svg>
      </button> -->
      <button class="btn btn-info" aria-label="refresh" onclick={deleteLogs}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"/></svg>
      </button>
      {#if tail}
        <button class="btn btn-neutral w-40 justify-between items-center" onclick={() => tail = false}>
          <span class="text-sm">
            <span class="loading loading-ring loading-sm"></span>
          </span>
          Pause
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path fill="currentColor" d="M1 4.804a1 1 0 0 1 1.53-.848l5.113 3.196a1 1 0 0 1 0 1.696L2.53 12.044A1 1 0 0 1 1 11.196zM13.5 4.5A.5.5 0 0 1 14 4h.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H14a.5.5 0 0 1-.5-.5zm-3-.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5v-7A.5.5 0 0 0 11 4z"/></svg>
        </button>
      {:else}
        <button class="btn btn-neutral w-40 justify-between" onclick={() => tail = true}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m-1 14H9V8h2zm4 0h-2V8h2z"/></svg>
          Start
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path fill="currentColor" d="M1 4.804a1 1 0 0 1 1.53-.848l5.113 3.196a1 1 0 0 1 0 1.696L2.53 12.044A1 1 0 0 1 1 11.196zM13.5 4.5A.5.5 0 0 1 14 4h.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H14a.5.5 0 0 1-.5-.5zm-3-.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5v-7A.5.5 0 0 0 11 4z"/></svg>
        </button>
      {/if}
    </div>

    <input id="filter" class="input" type="text" bind:value={tagFilter} placeholder="Filter by tags">

    <div class="flex gap-2">
      {#each logLevels as logLevel (logLevel)}
      <button onclick={() => selectLevel(logLevel)} class={`btn ${getColor(logLevel)} ${getBorder(logLevel)}`}>{ logLevel }</button>
      {/each}
    </div>
  </div>

  {#each presentedLogs as log (log.time)}
    <LogPresenter log={log}></LogPresenter>
  {/each}
</main>