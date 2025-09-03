import { error, json, type RequestHandler } from "@sveltejs/kit";

// why does this not work most of the time
// const response = await fetch(`https://api.warframestat.us/profile/${player.id}/stats?`);
// yes, this is really simlified
export type ContentWeaponType = {
	Results: Array<{
		AccountId: { $oid: string };
		DisplayName: string;
		PlayerLevel: number;
		GuildId: { $oid: string };
		GuildName: string;
		GuildTier: number;
		GuildXp: number;
		GuildClass: number;
	}>;
	Stats: {
		MissionsCompleted: number;
		MissionsQuit: number;
		MissionsFailed: number;
		MissionsInterrupted: number;
		MissionsDumped: number;
		PickupCount: number;
		Weapons: Array<{
			fired?: number;
			hits?: number;
			kills?: number;
			headshots?: number;
			equipTime?: number;
			xp?: number;
			assists?: number;
			type: string;
		}>;
		MeleeKills: number;
		TimePlayedSec: number;
		Income: number;
		Rating: number;
		Rank: number;
		Deaths: number;
		PvpGamesPendingMask: number;
		HealCount: number;
		ReviveCount: number;
		PlayerLevel: number;
		GuildName: string;
	};
};

export const GET: RequestHandler = async ({ url }) => {
	const playerId = url.searchParams.get("playerId");

	if (!playerId || playerId.length !== 24) error(400, { message: "Invalid playerId" });

	const response = await fetch(
		`https://content.warframe.com/dynamic/getProfileViewingData.php?playerId=${playerId}`
	);
	const data: ContentWeaponType = await response.json();

	return json(data.Stats.Weapons.map((v) => ({ xp: v.xp || 0, uniqueName: v.type })));
};
