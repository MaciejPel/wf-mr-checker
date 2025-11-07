import { error, json, type RequestHandler } from "@sveltejs/kit";

// why these do not work most of the time
// https://api.warframestat.us/profile/${playerId}/stats?
// https://api.warframe.com/cdn/getProfileViewingData.php?playerId=${playerId}
// https://content.warframe.com/dynamic/getProfileViewingData.php?playerId=${playerId}

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
		`https://api.warframe.com/cdn/getProfileViewingData.php?playerId=${playerId}`,
		{
			headers: {
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
				Accept: "*/*",
			},
		}
	);
	const data: ContentWeaponType = JSON.parse(await response.text());

	return json(data.Stats.Weapons.map((v) => ({ xp: v.xp || 0, uniqueName: v.type })));
};
