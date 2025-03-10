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
  let tagFilter = $state("")
  let logs = $state<Log[]>([])
  let tail = $state(true)

  let presentedLogs = $derived([ ...logs ].slice(-500).reverse().filter(log => {

    if (logLevels.indexOf(log.level) < logLevels.indexOf(selectedLogLevel))
      return false

    if (tagFilter && !tagFilter.split(",").map(tag => tag.trim()).every(tag => log.tags && log.tags.some(t => t.match(new RegExp(tag)))))
      return false

    return true
  }))

  const fetchLogs = async (readLogsCount: number) => {
    const response = await fetch(`/api/load?from=${readLogsCount}`).catch(() => {})
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
  
  const reset = async () => {
    const response = await fetch(`/api/reset`).catch(() => {})
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

  const formatDate = (num: number) => {
    const pad = (n: number) => `${n}`.length === 1 ? `0${n}` : `${n}`
    const date = new Date(num)
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const formatLog = (log: Log) => {
    const { tags, msg } = log
    const content = JSON.stringify({ tags, msg })
    return content.length < 100 ? content : content.slice(0, 100) + "..."
  }

  onMount(() => {
    fetchLogs(logs.length)

    const interval = setInterval(() => {
      if (tail)
        fetchLogs(logs.length)
    }, 1000)

    return () => clearInterval(interval)
  })
</script>

<main>
  <div class="flex items-center p-3 bg-accent-content justify-between">
    <div class="flex gap-2">
      <button class="btn btn-error" aria-label="clear" onclick={deleteLogs}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="currentColor"><path fill-rule="evenodd" d="M17 5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1H4a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V7h1a1 1 0 1 0 0-2zm-2-1H9v1h6zm2 3H7v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1z" clip-rule="evenodd"/><path d="M9 9h2v8H9zm4 0h2v8h-2z"/></g></svg>
      </button>
      <button class="btn btn-info" aria-label="refresh" onclick={reset}>
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

    <input class="input" type="text" bind:value={tagFilter} placeholder="Filter by tags">

    <div class="flex">
      {#each logLevels as logLevel}
      <button onclick={() => selectedLogLevel = logLevel} class={`btn ${getColor(logLevel)} ${selectedLogLevel === logLevel ? 'border-2 border-neutral-content' : 'border-2'}`}>{ logLevel }</button>
      {/each}
    </div>
  </div>

  {#each presentedLogs as log}
    <LogPresenter log={log}></LogPresenter>
  {/each}
</main>