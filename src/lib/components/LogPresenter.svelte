<script lang="ts">
  import { slide } from "svelte/transition";
  import KeyPresenter from "./KeyPresenter.svelte";
  import { onMount } from "svelte";

  type JSONStringifiable =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JSONStringifiable }
    | JSONStringifiable[];

  type LogLevel = typeof logLevels[number]

  type Log = { level: LogLevel, tags: string[], time: number, msg: string } & Record<string, JSONStringifiable>

  let { log }: { log: Log } = $props()

  const logLevels = [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
  ] as const

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

  let isOpen = $state(false)

  onMount(() => {
    let pressedButtons: string[] = []

    const handle = (event: Event, buttons: string[], action: () => void) => {
      if (buttons.every(button => pressedButtons.includes(button))) {
        event.preventDefault()
        action()
      }
    }

    const keydownHandler = (event: KeyboardEvent) => {
      if (!pressedButtons.includes(event.code))
        pressedButtons = [ ...pressedButtons, event.code ]
      handle(event, [ "AltRight", "KeyC" ], () => { isOpen = false })
      handle(event, [ "AltLeft", "KeyC" ], () => { isOpen = false })
    }
    
    const keyupHandler = (event: KeyboardEvent) => {
      pressedButtons = pressedButtons.filter(k => k !== event.code)
    }

    document.body.addEventListener('keydown', keydownHandler)
    document.body.addEventListener('keyup', keyupHandler)

    return () => {
      document.body.removeEventListener('keydown', keydownHandler)
      document.body.removeEventListener('keyup', keyupHandler)
    }
  })
</script>

<section class="p-1 bg-accent-content m-2">
  <div class="flex items-center justify-between">
    <div class={`p-1 rounded-md ${getColor(log.level)} m-2 flex items-center gap-2`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8.4 15q.475 0 .813-.337t.337-.813v-3.7q0-.475-.337-.812T8.4 9H6.75q-.325 0-.537.213T6 9.75v4.5q0 .325.213.538T6.75 15zm-1.25-1.15v-3.7H8.4v3.7zM10.875 15h1.9q.225 0 .388-.175t.162-.425q0-.225-.162-.388t-.388-.162h-1.5v-1.3H12q.25 0 .413-.162t.162-.413t-.162-.412T12 11.4h-.725v-1.25h1.475q.25 0 .413-.162t.162-.413t-.162-.412T12.75 9h-1.875q-.325 0-.537.213t-.213.537v4.5q0 .325.213.538t.537.212m5.15-.025q.325 0 .563-.213t.312-.537l1.2-4.5q.075-.275-.1-.5T17.55 9q-.2 0-.363.113t-.212.312l-.95 3.675l-.975-3.675q-.05-.2-.2-.312T14.5 9q-.275 0-.45.225t-.1.5l1.2 4.5q.075.325.313.538t.562.212M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21z"/></svg>
      <div>{ formatDate(log.time) }</div>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M13 21q-.425 0-.712-.288T12 20t.288-.712T13 19h6V5h-6q-.425 0-.712-.288T12 4t.288-.712T13 3h6q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm-1.825-8H4q-.425 0-.712-.288T3 12t.288-.712T4 11h7.175L9.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L14.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288T9.3 16.25q-.275-.3-.262-.712t.287-.688z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20"><path fill="currentColor" fill-rule="evenodd" d="M10 1a1 1 0 0 1 1 1v16a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1" clip-rule="evenodd"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32"><path fill="currentColor" d="M6 3v26h20V9.594l-.28-.313l-6-6l-.314-.28H6zm2 2h10v6h6v16H8zm12 1.438L22.563 9H20zM11 13v2h10v-2zm0 4v2h10v-2zm0 4v2h10v-2z"/></svg>
      <div class="px-2 text-neutral-content">
        { formatLog(log) }
      </div>
    </div>
    <div>
    </div>
    <div class="p-1">
      {#if isOpen}
        <button class="btn" onclick={() => isOpen = false}>
          Collapse
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 15h-4m0 0v4m0-4l4 4M5 9h4m0 0V5m0 4L5 5m14 4h-4m0 0V5m0 4l4-4M5 15h4m0 0v4m0-4l-4 4"/></svg>
        </button>
      {:else}
        <button class="btn" onclick={() => isOpen = true}>
          Expand
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H4m0 0v4m0-4l5 5m7-5h4m0 0v4m0-4l-5 5M8 20H4m0 0v-4m0 4l5-5m7 5h4m0 0v-4m0 4l-5-5"/></svg>
        </button>
      {/if}
    </div>
  </div>
  {#if isOpen}
    <div transition:slide class="pr-3">
      <KeyPresenter part={log}></KeyPresenter>
    </div>
  {/if}
</section>