<script lang="ts">
	import { slide } from "svelte/transition";
  import Self from "./KeyPresenter.svelte"

  type JSONStringifiable = string
    | number
    | boolean
    | null
    | { [key: string]: JSONStringifiable }
    | JSONStringifiable[];

  type Props = { part: JSONStringifiable }

  let { part }: Props = $props()

  let opened: string[] = $state([])

  const shortForm = (part: JSONStringifiable) => {
    const asString = JSON.stringify(part)
    if (asString.length < 100)
      return asString
    return asString.slice(0, 98) + "..."
  }

  let keys = $derived((typeof part === 'string' || typeof part === 'number' || typeof part === 'boolean' || part === null) ? null : Object.keys(part))
</script>

<div class="pl-3">
  {#if keys}
    {#each keys as key}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="flex justify-between py-1 my-1 hover:bg-accent/50 cursor-pointer" onclick={() => opened = opened.includes(key) ? opened.filter(k => k !== key) : [ ...opened, key ]}>
        <div class="flex items-center">
          <span class="text-primary">{key}</span>&nbsp;- {shortForm(part[key])}
        </div>
      </div>
      <div>
        {#if opened.includes(key)}
          <div transition:slide>
            <Self part={part[key]}></Self>
          </div>
        {/if}
      </div>
    {/each}
  {:else}
    <div class="p-2 m-1 border-2 border-primary text-primary">
      <pre class="whitespace-pre-wrap">{part}</pre>
    </div>
  {/if}
</div>