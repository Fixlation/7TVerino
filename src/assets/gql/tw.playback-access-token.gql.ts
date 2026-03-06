import gql from "graphql-tag";

export const twitchPlaybackAccessTokenQuery = gql`
	query StreamPlaybackAccessToken($login: String!, $playerType: String!) {
		streamPlaybackAccessToken(
			channelName: $login
			params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType }
		) {
			signature
			value
		}
	}
`;

export namespace twitchPlaybackAccessTokenQuery {
	export interface Variables {
		login: string;
		playerType: string;
	}

	export interface Response {
		streamPlaybackAccessToken: {
			signature: string;
			value: string;
		} | null;
	}
}
