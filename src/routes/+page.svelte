<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import items from "$lib/items.json";
	import { categories } from "$lib/constants";

	import IconArrowSquareOutRegular from "phosphor-icons-svelte/IconArrowSquareOutRegular.svelte";
	import IconMagnifyingGlassRegular from "phosphor-icons-svelte/IconMagnifyingGlassRegular.svelte";
	import IconXRegular from "phosphor-icons-svelte/IconXRegular.svelte";
	import IconTriangleRegular from "phosphor-icons-svelte/IconTriangleRegular.svelte";

	type WeaponType = { uniqueName: string; xp: number };

	let mounted = $state(false);
	let fetchStatus = $state({ error: false, loading: false, ts: 0 });
	let player: { id: string; data: WeaponType[] | null; ts: number } = $state({
		id: "",
		data: null,
		ts: 0,
	});
	let filters: { search: string; categories: string[]; mastered: boolean } = $state({
		search: "",
		categories,
		mastered: true,
	});
	let filteredItems = $derived(
		items
			.filter((item) => {
				const searchItems = filters.search
					.toLowerCase()
					.split(";")
					.map((v) => v.trim())
					.filter((v) => v);
				return (
					(searchItems.length
						? searchItems.some((v) => item.name.toLowerCase().includes(v))
						: true) && filters.categories.includes(item.category.toLowerCase())
				);
			})
			.map((item) => {
				const entry = player.data?.find((x) => x.uniqueName === item.uniqueName);
				return {
					...item,
					mastered: isMastered(
						item.maxLevelCap || 30,
						entry?.xp || 0,
						item.category === "Warframes"
					),
				};
			})
			.filter((item) => (filters.mastered ? item : !item.mastered))
	);

	onMount(() => {
		try {
			player = JSON.parse(localStorage.getItem("player") || "");
		} catch (error) {
			console.log("invalid ls value", error);
		}
		filters.search = page.url.searchParams.get("search") || "";
		if (filters.search) goto("/", { keepFocus: true, noScroll: true, replaceState: true }); // should or should not consume?
		mounted = true;
	});

	async function handlePlayerSearch(e: Event) {
		fetchStatus.loading = true;
		try {
			const response = await fetch(`/api/stats?playerId=${player.id}`);
			if (response.status !== 200) throw new Error();
			const data: WeaponType[] = await response.json();
			player.data = data;
			player.ts = Date.now();
			localStorage.setItem("player", JSON.stringify(player));
			fetchStatus.error = false;
		} catch (error) {
			console.log("fetch error", error);
			fetchStatus.error = true;
		} finally {
			fetchStatus.loading = false;
			fetchStatus.ts = Date.now();
		}
	}

	function isMastered(maxLevel: number, xp: number, warframe: boolean) {
		const lvl = Math.min(maxLevel, Math.floor(Math.sqrt(xp / (warframe ? 1000 : 500))));
		return lvl === maxLevel;
	}
</script>

<svelte:head>
	<title>Warframe Mastery Rank Checker</title>
</svelte:head>
<div class="sticky top-0 left-0 z-10 flex flex-col gap-4 bg-zinc-900/50 px-8 py-4 backdrop-blur-md">
	<div class="grid w-full grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
		<div class="flex flex-col gap-0.5 place-self-center self-center lg:[place-self:center_start]">
			<div class="flex items-stretch">
				<input
					type="text"
					bind:value={player.id}
					class="self-start border border-r-0 border-zinc-700 px-2 py-0.5 outline-[0]"
					placeholder="Player ID"
				/>
				<button
					type="button"
					class="cursor-pointer border border-teal-900 bg-teal-900 px-2 capitalize"
					onclick={handlePlayerSearch}
				>
					<IconMagnifyingGlassRegular />
				</button>
				<button
					type="button"
					class="cursor-pointer border border-red-900 bg-red-900 px-2 capitalize"
					onclick={() => {
						player = { id: "", data: null, ts: 0 };
						localStorage.removeItem("player");
					}}
				>
					<IconXRegular />
				</button>
			</div>
			{#if fetchStatus.error && !fetchStatus.loading}
				<div class="text-sm text-red-500">
					Fetch failed ({new Date(fetchStatus.ts).toLocaleString()})
				</div>
			{:else if !fetchStatus.error && !fetchStatus.loading && player.data}
				<div class="text-sm text-teal-500">Last fetch ({new Date(player.ts).toLocaleString()})</div>
			{/if}
		</div>
		<div class="flex flex-col items-start place-self-center">
			<div class="flex w-full text-center text-sm select-none">
				<span class="flex-1 bg-teal-900 px-1 py-0.5">
					Total {items.length}
				</span>
				<span class="flex-1 bg-teal-900 px-1 py-0.5">
					Filtered {filteredItems.length}
				</span>
				<span class="flex-1 bg-teal-900 px-1 py-0.5">
					Mastered {filteredItems.filter((v) => v.mastered).length}
				</span>
			</div>
			<div class="flex items-stretch">
				<input
					type="text"
					bind:value={filters.search}
					class="border border-r-0 border-zinc-700 px-2 py-0.5 outline-[0]"
					placeholder="MultiSearch (separator ;)"
				/>
				<button
					type="button"
					class="cursor-pointer border border-red-900 bg-red-900 px-2 capitalize"
					onclick={() => (filters.search = "")}
				>
					<IconXRegular />
				</button>
				<button
					type="button"
					onclick={() => (filters.mastered = !filters.mastered)}
					class={{
						"cursor-pointer border px-2 capitalize": true,
						"border-indigo-900 bg-indigo-900": filters.mastered,
						"border-zinc-800 bg-zinc-800": !filters.mastered,
					}}
				>
					<IconTriangleRegular />
				</button>
			</div>
		</div>
		<div class="flex h-full flex-col items-stretch gap-1 place-self-end text-sm">
			<div class="flex grow self-end">
				<button
					type="button"
					onclick={() => (filters.categories = categories)}
					class="cursor-pointer bg-teal-900 px-4 py-1 capitalize"
				>
					All
				</button>
				<button
					type="button"
					onclick={() => (filters.categories = [])}
					class="cursor-pointer bg-red-900 px-2 py-1 capitalize"
				>
					None
				</button>
			</div>
			<div class="flex grow flex-wrap justify-end gap-1">
				{#each categories as category}
					<button
						type="button"
						onclick={() => {
							if (filters.categories.includes(category))
								filters.categories = filters.categories.filter((v) => v !== category);
							else filters.categories.push(category);
						}}
						class={{
							"cursor-pointer px-2 py-1  capitalize": true,
							"bg-teal-900": filters.categories.includes(category),
							"bg-zinc-800": !filters.categories.includes(category),
						}}
					>
						{category}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
{#if mounted}
	<div class="grid grid-cols-3 self-start px-8 pb-8 md:grid-cols-6 lg:grid-cols-12">
		{#each filteredItems as item}
			<div
				class={{
					"group flex flex-col items-center justify-center gap-0.5 border border-zinc-600 p-2 text-center ": true,
					"bg-zinc-950 hover:bg-zinc-900": !item.mastered,
					"bg-teal-950 hover:bg-teal-900": item.mastered,
				}}
			>
				<div class="relative flex flex-col">
					<img
						src={item.wikiaThumbnail ||
							`https://wiki.warframe.com/images/${item.name.replaceAll(" ", "")}.png`}
						alt={item.name}
					/>
					{#if item.wikiAvailable}
						<a
							href={item.wikiaUrl}
							target="_blank"
							class="absolute right-0 bottom-1 border border-zinc-600 bg-zinc-800 p-1 opacity-0 group-hover:opacity-100"
						>
							<IconArrowSquareOutRegular class="size-4" />
						</a>
					{/if}
				</div>
				{item.name}
			</div>
		{/each}
	</div>
{/if}
